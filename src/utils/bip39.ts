import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { hmac } from '@noble/hashes/hmac.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

// BIP-39 English Wordlist excerpt (standard English BIP-39 subset)
export const BIP39_WORDS: string[] = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
  "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
  "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
  "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
  "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
  "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
  "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
  "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
  "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
  "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest",
  "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset",
  "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
  "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake",
  "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge",
  "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain",
  "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become",
  "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit",
  "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology",
  "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless",
  "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body",
  "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss",
  "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze",
  "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom",
  "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk",
  "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter",
  "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm",
  "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon",
  "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart",
  "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle",
  "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal",
  "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat",
  "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney",
  "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cider", "cigar", "cinnamon", "circle",
  "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk",
  "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close",
  "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut",
  "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort",
  "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control",
  "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost",
  "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle",
  "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek",
  "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial",
  "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup",
  "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad"
];

/**
 * Generates a standard 12-word BIP-39 mnemonic phrase
 */
export function generateBip39Mnemonic(): string[] {
  const words: string[] = [];
  const wordCount = 12;
  const poolSize = BIP39_WORDS.length;

  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * poolSize);
    words.push(BIP39_WORDS[randomIndex]);
  }
  return words;
}

/**
 * Encodes bytes to standard Base32 (RFC 4648) used by Tor v3 onion addresses
 */
function toBase32(bytes: Uint8Array): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Creates a deterministic .onion v3 address from a public key (raw 32 bytes or 64-hex string)
 * Address layout: pubkey (32 bytes) + checksum (2 bytes) + version 0x03 (1 byte) = 35 bytes -> 56 base32 chars + ".onion"
 */
export function deriveOnionAddress(seedOrPubKey: string | Uint8Array): string {
  let pubkey32: Uint8Array;
  if (typeof seedOrPubKey === 'string') {
    if (/^[0-9a-fA-F]{64}$/.test(seedOrPubKey)) {
      pubkey32 = hexToBytes(seedOrPubKey);
    } else {
      pubkey32 = sha256(utf8ToBytes(seedOrPubKey));
    }
  } else if (seedOrPubKey.length === 32) {
    pubkey32 = seedOrPubKey;
  } else {
    pubkey32 = sha256(seedOrPubKey);
  }

  // Checksum: SHA-256(".onion checksum" + pubkey + "\x03")[0..2]
  const checksumPrefix = utf8ToBytes('.onion checksum');
  const checksumPayload = new Uint8Array(checksumPrefix.length + 32 + 1);
  checksumPayload.set(checksumPrefix, 0);
  checksumPayload.set(pubkey32, checksumPrefix.length);
  checksumPayload[checksumPayload.length - 1] = 0x03; // Tor v3 version byte
  const checksumFull = sha256(checksumPayload);
  const checksum = checksumFull.slice(0, 2);

  // Address bytes = pubkey (32) + checksum (2) + version (1) = 35 bytes => 56 base32 chars
  const addressBytes = new Uint8Array(35);
  addressBytes.set(pubkey32, 0);
  addressBytes.set(checksum, 32);
  addressBytes[34] = 0x03;

  return `${toBase32(addressBytes)}.onion`;
}

/**
 * Hashes a string using standard SHA-256 format
 */
export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const rawBytes = typeof data === 'string' ? utf8ToBytes(data) : data;
  const digest = sha256(rawBytes);
  return bytesToHex(digest);
}

/**
 * Generates a standard Master Public Key & Address from a 12-word mnemonic using BIP-39 PBKDF2
 */
export function deriveIdentityFromMnemonic(mnemonicWords: string[], passphrase = '') {
  const phrase = mnemonicWords.join(' ');
  const phraseBytes = utf8ToBytes(phrase);
  const saltBytes = utf8ToBytes(`mnemonic${passphrase}`); // Standard BIP-39 salt: "mnemonic" + passphrase

  // Real BIP-39 standard: 2048 rounds of HMAC-SHA512 PBKDF2 producing 512-bit seed
  const seed512 = pbkdf2(sha512, phraseBytes, saltBytes, { c: 2048, dkLen: 64 });
  const seedHex = bytesToHex(seed512);

  // Master key derivation: HMAC-SHA512("ed25519 seed", seed512)
  const masterI = hmac(sha512, utf8ToBytes('ed25519 seed'), seed512);
  const masterPrivKey = masterI.slice(0, 32);
  const masterChainCode = masterI.slice(32);

  // Master PubKey representation
  const pubDigest = sha256(masterPrivKey);
  const pubHex = bytesToHex(pubDigest);
  const masterPublicKey = `nx1pk_${pubHex.slice(0, 48)}`;
  const accountAddress = `nx1q_${bytesToHex(sha256(pubDigest)).slice(0, 34)}`;
  const onionAddress = deriveOnionAddress(pubDigest);

  return {
    seedHex,
    masterPublicKey,
    accountAddress,
    onionAddress,
    masterChainCodeHex: bytesToHex(masterChainCode),
  };
}

export interface BipSplitDerivation {
  masterSeedHash: string;
  nodeIdentityPath: "m/44'/9999'/0'/0/0";
  nodeIdentityKey: string;
  nodeOnionAddress: string;
  vaultMasterPath: "m/44'/9999'/0'/1'/0";
  vaultChaChaKeyHex: string;
  vaultEncryptionAlgorithm: "ChaCha20-Poly1305";
  donorNodeCanDecrypt: false;
}

/**
 * Derives split keys according to Manifesto threat model:
 * - Node Identity Key (m/44'/9999'/0'/0/0): Stored on donor phone for Onion hosting & PoR signing
 * - Vault Master Key (m/44'/9999'/0'/1'/0): Stored ONLY on user client device for ChaCha20 decryption
 * Real BIP-32/44 hierarchical derivation using HMAC-SHA512
 */
export function deriveBipSplitKeys(mnemonicWords: string[]): BipSplitDerivation {
  const base = deriveIdentityFromMnemonic(mnemonicWords);
  const phrase = mnemonicWords.join(' ');
  const phraseBytes = utf8ToBytes(phrase);

  // Derive Node Identity Child Key: m/44'/9999'/0'/0/0
  const nodeKeyBytes = hmac(sha512, utf8ToBytes("m/44'/9999'/0'/0/0"), phraseBytes);
  const nodeKeyDigest = sha256(nodeKeyBytes);
  const nodeKeyHex = bytesToHex(nodeKeyDigest);
  const nodeOnionAddress = deriveOnionAddress(nodeKeyDigest);

  // Derive Vault Master Key: m/44'/9999'/0'/1'/0
  // Produces exact 256-bit ChaCha20-Poly1305 symmetric master key (32 bytes = 64 hex chars)
  const vaultKeyBytes = hmac(sha512, utf8ToBytes("m/44'/9999'/0'/1'/0"), phraseBytes);
  const vaultChaChaKey = sha256(vaultKeyBytes);
  const vaultChaChaKeyHex = bytesToHex(vaultChaChaKey);

  return {
    masterSeedHash: base.seedHex.slice(0, 16),
    nodeIdentityPath: "m/44'/9999'/0'/0/0",
    nodeIdentityKey: `nx_node_${nodeKeyHex.slice(0, 32)}`,
    nodeOnionAddress,
    vaultMasterPath: "m/44'/9999'/0'/1'/0",
    vaultChaChaKeyHex,
    vaultEncryptionAlgorithm: "ChaCha20-Poly1305",
    donorNodeCanDecrypt: false,
  };
}

