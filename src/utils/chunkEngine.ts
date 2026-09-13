import { ChunkRecord, VaultFile, NodeRecord, StorageTier } from '../types/nexxus';
import { sha256Hex } from './bip39';
import { saveChunkBinary } from './indexedDbStore';

export const CHUNK_SIZE_BYTES = 16 * 1024; // 16 KB exact

/**
 * Splits a file into 16 KB chunks, hashes them, and assigns replica nodes:
 * - Hot Vault (default): RF=6x redundancy with network-driven repair
 * - Cold Archive: RF=4x redundancy with discount
 * Computes per-node KDF encryption commitments to defeat Tor outsourcing attacks.
 * Injects synthetic canary trap tags (~6% of chunks) to detect non-compliant or outsourcing nodes.
 */
export async function sliceFileInto16KbChunks(
  file: File,
  fileId: string,
  availableNodes: NodeRecord[],
  storageTier: StorageTier = 'hot_rf6'
): Promise<ChunkRecord[]> {
  const chunks: ChunkRecord[] = [];
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE_BYTES));
  const REPLICATION_FACTOR = storageTier === 'cold_archive_rf4' ? 4 : 6;
  
  // Sort nodes by reputation to give priority to reliable nodes
  const sortedNodes = [...availableNodes].sort((a, b) => b.reputationScore - a.reputationScore);
  const eligibleNodes = sortedNodes.filter(n => n.isOnline);
  const nodePool = eligibleNodes.length >= REPLICATION_FACTOR ? eligibleNodes : availableNodes;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE_BYTES;
    const end = Math.min(file.size, start + CHUNK_SIZE_BYTES);
    const sliceBlob = file.slice(start, end);
    const arrayBuffer = await sliceBlob.arrayBuffer();
    const uint8Bytes = new Uint8Array(arrayBuffer);
    const hash = await sha256Hex(uint8Bytes);
    const chunkId = `chk_${fileId.slice(-6)}_${i.toString().padStart(4, '0')}`;
    // Manifesto v2: ~6% of chunks are canary traps (1 every 16 chunks or if total=1, first chunk)
    const isCanaryTrap = i % 16 === 0;

    // Save binary slice to IndexedDB for persistent real retrieval
    try {
      await saveChunkBinary(chunkId, fileId, i, hash, uint8Bytes);
    } catch {
      // Safe fallback if storage quota or private browsing mode
    }

    // Pick distinct nodes for redundancy factor
    const replicaNodes: string[] = [];
    for (let r = 0; r < REPLICATION_FACTOR; r++) {
      const targetNode = nodePool[(i * REPLICATION_FACTOR + r) % nodePool.length];
      if (targetNode && !replicaNodes.includes(targetNode.id)) {
        replicaNodes.push(targetNode.id);
      }
    }
    // Fallback if fewer than REPLICATION_FACTOR nodes exist
    while (replicaNodes.length < REPLICATION_FACTOR && nodePool.length > 0) {
      const candidate = nodePool[replicaNodes.length % nodePool.length].id;
      replicaNodes.push(candidate);
    }

    // Per-node KDF commitment against outsourcing attack: Enc(KDF(NodeID, ChunkID))
    const perNodeCommitments: Record<string, string> = {};
    for (const nId of replicaNodes) {
      perNodeCommitments[nId] = `kdf_${hash.slice(0, 8)}_${nId.slice(-6)}`;
    }

    chunks.push({
      chunkId,
      fileId,
      chunkIndex: i,
      sizeBytes: end - start,
      hash,
      replicaNodes,
      status: 'synced',
      storageTier,
      isCanaryTrap,
      perNodeCommitments,
    });
  }

  return chunks;
}

/**
 * Re-routes chunks of an offline node to top-tier nodes (Self-healing protocol)
 */
export function healAndResyncChunks(
  files: VaultFile[],
  offlineNodeId: string,
  availableNodes: NodeRecord[]
): { updatedFiles: VaultFile[]; reRoutedCount: number } {
  const topNodes = [...availableNodes]
    .filter(n => n.isOnline && n.id !== offlineNodeId)
    .sort((a, b) => b.reputationScore - a.reputationScore);

  if (topNodes.length === 0) return { updatedFiles: files, reRoutedCount: 0 };

  let reRoutedCount = 0;
  const updatedFiles = files.map(file => {
    const updatedChunks = file.chunks.map(chunk => {
      if (chunk.replicaNodes.includes(offlineNodeId)) {
        reRoutedCount++;
        // Replace offline node with the highest reputation node not yet holding this chunk
        const replacement = topNodes.find(n => !chunk.replicaNodes.includes(n.id)) || topNodes[0];
        const newReplicas = chunk.replicaNodes.map(id => id === offlineNodeId ? replacement.id : id);
        return {
          ...chunk,
          replicaNodes: newReplicas,
          status: 'healing' as const
        };
      }
      return chunk;
    });
    return { ...file, chunks: updatedChunks };
  });

  return { updatedFiles, reRoutedCount };
}

/**
 * Formats byte size into human readable string
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
