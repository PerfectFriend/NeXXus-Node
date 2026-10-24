# Architectural Refactoring & Monolith Decomposition Plan

Comprehensive blueprint for refactoring the NeXXus codebase from monolithic components into modular, enterprise-grade architecture using React Context API providers, specialized custom hooks, and isolated UI subcomponents, documented with English JSDoc standards.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed based on the initial interview:
> - **Decomposition Strategy**: Custom React hooks for business logic and isolated UI subcomponents (preserving high developer velocity without overengineering).
> - **Documentation & Comments**: English language conforming to enterprise open-source standards (comprehensive JSDoc with `@param`, `@returns`, and architectural invariants).
> - **State Management**: React Context API with specialized domain providers (`AuthContext`, `SwarmContext`, `VaultContext`, `MessengerContext`) replacing the single monolithic `App.tsx` state bucket.

---

## 1. Overview & Core Concept

### What This Delivers
A complete structural decomposition of the application's monolithic files:
- **`src/App.tsx`** (~800 lines): Transformed into a clean, declarative root coordinator (~120 lines) containing domain provider wrappers and an active view router.
- **`src/components/MessengerView.tsx`** (~870 lines): Decomposed into dedicated presentation subcomponents (`NavigationDrawer`, `ContactSidebar`, `ChatThread`, `MessageComposer`) and reusable hooks (`useVoiceRecorder`, `useAttachmentDownloader`).
- **`src/components/StorageSectionsDashboard.tsx`** (~800 lines): Logic separated into `useStorageBarter` hook and modular subcomponents (`SectionGrid`, `MiningStatsCard`, `AllocationControls`).
- **`src/components/SwarmFleetView.tsx`** (~540 lines): Split into `ClusterMetricsBar`, `NodeDeviceCard`, and `ConnectDeviceModal`.

### Key Value
- **Zero Monoliths**: No single component exceeds 250 lines of code.
- **Instant Developer Comprehension**: Any engineer opening any file immediately understands its single responsibility, typed contracts, and state flow.
- **Strict Protocol Integrity**: 100% preservation of all 150+ protocol unit tests, BIP-39 invariants, ChaCha20-Poly1305 encryption, and golden vectors.

---

## 2. Technical Architecture & Component Hierarchy

### System Domain Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                               App.tsx                                  │
│                 (Root Composition & View Router)                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Wraps with Domain Contexts
┌───────────────────────────────────▼────────────────────────────────────┐
│                           Context Providers Layer                      │
│ ┌───────────────────┐ ┌───────────────────┐ ┌────────────────────────┐ │
│ │    AuthContext    │ │   SwarmContext    │ │      VaultContext      │ │
│ │ (Identity, PIN,   │ │ (Nodes, Grace,    │ │ (Files, 16KB Chunks,   │ │
│ │  Decoy, Onboard)  │ │  DHT P2P Mesh)    │ │  Quotas, Barter Math)  │ │
│ └─────────┬─────────┘ └─────────┬─────────┘ └───────────┬────────────┘ │
│           │                     │                       │              │
│           └─────────────────────┼───────────────────────┘              │
│                                 ▼                                      │
│                       MessengerContext                                 │
│                (Chats, P2P SMP & xFTP Wire Frames)                     │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ Consumed by Modular Views
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│    MessengerView     │ │ StorageSectionsDash  │ │    SwarmFleetView    │
│ ┌──────────────────┐ │ │ ┌──────────────────┐ │ │ ┌──────────────────┐ │
│ │ NavigationDrawer │ │ │ │ SectionGrid      │ │ │ │ ClusterHeader    │ │
│ ├──────────────────┤ │ │ ├──────────────────┤ │ │ ├──────────────────┤ │
│ │ ContactSidebar   │ │ │ │ MiningMetrics    │ │ │ │ NodeCardList     │ │
│ ├──────────────────┤ │ │ ├──────────────────┤ │ │ ├──────────────────┤ │
│ │ ChatThread       │ │ │ │ AllocationSlider │ │ │ │ ConnectNodeModal │ │
│ ├──────────────────┤ │ │ └──────────────────┘ │ │ └──────────────────┘ │
│ │ MessageComposer  │ │ └──────────────────────┘ └──────────────────────┘
│ └──────────────────┘ │
└──────────────────────┘
```

---

## 3. Detailed Refactoring Breakdown by Module

### Phase 1: Domain Context Providers & Custom Hooks

1. **`src/context/AuthContext.tsx`** & **`src/hooks/useAuth.ts`**
   - Manages: `isOnboarded`, `isLocked`, `isDecoyMode`, `identity`, `permissions`.
   - Actions: `unlock(pin, isPanicPin)`, `quickLock()`, `completeOnboarding(identity)`, `switchAccount()`, `updateIdentity(patch)`.
   - Enterprise JSDoc: Detailed documentation of the anti-torture duress PIN flow, BIP-39 mnemonic lifecycle, and local encrypted session persistence.

2. **`src/context/SwarmContext.tsx`** & **`src/hooks/useSwarm.ts`**
   - Manages: `nodes`, `currentNode`, `graceNodeId`, `graceRemainingSeconds`, `selfHealingNotification`.
   - Actions: `toggleNodeOnline(nodeId)`, `simulateEmergencyGrace(nodeId)`, `expireGraceNow(nodeId)`, `addNewNode(nodeData)`, `updateCurrentNode(patch)`.
   - Enterprise JSDoc: Detailed explanation of SLA penalties, 14-day warning thresholds, 28-day eviction schedule, and autonomous Reed-Solomon self-healing.

3. **`src/context/VaultContext.tsx`** & **`src/hooks/useVault.ts`**
   - Manages: `files`, `personalSections`, `totalAllocatedGb`, `personalVaultQuotaGb`.
   - Actions: `addFile(file)`, `deleteFile(fileId)`, `updateFiles(files)`, `setPersonalSections(count)`.
   - Enterprise JSDoc: Detailed documentation of the 16 GB barter invariant (16 GB barter grants 2.0 GB secret vault; expansion storage grants 1/8 bonus).

4. **`src/context/MessengerContext.tsx`** & **`src/hooks/useMessenger.ts`**
   - Manages: `messages`, `unreadCount`, `activePeer`.
   - Actions: `sendMessage(text, attachment)`, `subscribePeerMessages()`.
   - Integrates: `p2pMeshBus` for authentic binary wire frames (NEXX magic + ChaCha20-Poly1305 + SHA-256 checksum).

---

### Phase 2: Monolith Decomposition of `MessengerView.tsx`

Decompose the 872-line component into isolated, single-responsibility files:

1. **`src/components/messenger/NavigationDrawer.tsx`** (~140 lines)
   - Profile avatar with account address snippet and balance.
   - Clean, unboxed navigation buttons with subtle SVG icons and typography.
   - Quick Lock and Switch Account action triggers.

2. **`src/components/messenger/ContactSidebar.tsx`** (~150 lines)
   - Search filter bar with live debounce.
   - Contact rows with online/relay status, avatar gradients, and unread badges.
   - Pinned "Избранное (Хранилище)" item with real disk usage indicator.

3. **`src/components/messenger/ChatThread.tsx`** (~180 lines)
   - Message list auto-scrolling with smooth viewport anchoring.
   - E2EE status indicators (SMP vs xFTP).
   - Rich attachment cards with file size, 16KB chunk count, and decrypt-on-demand button.
   - Voice note audio player with scrub bar and duration.

4. **`src/components/messenger/MessageComposer.tsx`** (~130 lines)
   - Text input with multiline auto-expand and Enter-to-send.
   - Attachment picker with client-side 16KB chunk slicing.
   - Voice recording button using the `useVoiceRecorder` hook.

5. **`src/hooks/useVoiceRecorder.ts`** (~80 lines)
   - Clean encapsulation of the HTML5 `MediaRecorder` API, audio streams, and second counter.

6. **`src/hooks/useAttachmentDownloader.ts`** (~60 lines)
   - Reassembles and decrypts 16KB chunks on-the-fly and generates browser download anchors.

---

### Phase 3: Monolith Decomposition of `StorageSectionsDashboard.tsx`

Decompose the 799-line component:

1. **`src/hooks/useStorageBarter.ts`** (~90 lines)
   - Isolates the exact barter mathematics: allocated GB to 16 GB sections conversion, private vault quota calculation, daily estimated NEXX earnings, and foreign chunk saturation.

2. **`src/components/storage/SectionAllocationGrid.tsx`** (~140 lines)
   - Visual grid of 16 GB sections with Hot Vault (RF=6×) vs Cold Archive (RF=4×) color coding.

3. **`src/components/storage/MiningEarningsOverview.tsx`** (~120 lines)
   - Real-time earnings summary card, daily barter yield, and vesting batches summary.

---

### Phase 4: Monolith Decomposition of `SwarmFleetView.tsx`

Decompose the 534-line component:

1. **`src/components/fleet/ClusterMetricsStrip.tsx`** (~80 lines)
   - 4 compact KPI cards (Nodes Online, Fleet Capacity, Vault Quota 1/8, Fault Penalties).

2. **`src/components/fleet/NodeDeviceCard.tsx`** (~150 lines)
   - Individual node card with device icon (Android/Linux), Onion v3 status, ASN/ISP tag, battery, temperature, and grace period controls.

3. **`src/components/fleet/ConnectDeviceModal.tsx`** (~120 lines)
   - QR code pairing generator and manual onion address copy.

---

### Phase 5: Root Coordinator `src/App.tsx` Slimdown

- Reduce `App.tsx` to ~120 lines:
  - Wraps the application with `<AuthProvider>`, `<SwarmProvider>`, `<VaultProvider>`, and `<MessengerProvider>`.
  - Simple, readable switch statement for `activeTab` rendering (`'messenger'`, `'sections'`, `'fleet'`, `'appstore'`, `'dex'`, `'node'`, `'manual'`, `'health'`).
  - Splash screen and permissions modal gating cleanly delegated.

---

## 4. Documentation & Best Practices Standards

1. **Enterprise JSDoc Comments**:
   - Every exported function, hook, interface, and component will include structured JSDoc:
   ```typescript
   /**
    * Encapsulates the complete user authentication and sovereign identity state.
    *
    * Handles dual PIN verification, including the zero-trace Panic PIN which
    * dynamically activates Decoy Mode with isolated non-sensitive storage.
    *
    * @returns {AuthContextValue} The reactive authentication state and action dispatchers.
    */
   ```
2. **Explicit Type Signatures**:
   - No `any` types; all payloads, callbacks, and records are strongly typed against `src/types/nexxus.ts`.
3. **Anti-Slop & Zero-Pill Compliance**:
   - Clean, unboxed metadata (`·` separators), no decorative pulsating dots, strictly domain-grounded Tailwind styling.
4. **Test Verification**:
   - All 150+ protocol unit tests in `test/protocol.test.ts` and all 5 golden vector test suites in `test/golden-vectors.test.ts` will continue to pass without modification.

---

## 5. Execution Steps Summary

1. Create context directory: `src/context/` and create `AuthContext.tsx`, `SwarmContext.tsx`, `VaultContext.tsx`, `MessengerContext.tsx`.
2. Create custom hooks directory: `src/hooks/` and implement `useAuth.ts`, `useSwarm.ts`, `useVault.ts`, `useMessenger.ts`, `useVoiceRecorder.ts`, `useStorageBarter.ts`.
3. Create modular subcomponent directories:
   - `src/components/messenger/`
   - `src/components/storage/`
   - `src/components/fleet/`
4. Refactor `MessengerView.tsx`, `StorageSectionsDashboard.tsx`, and `SwarmFleetView.tsx` to consume the new subcomponents and hooks.
5. Refactor `src/App.tsx` to adopt the providers and slim router.
6. Run `lint_applet` (`tsc --noEmit`), `compile_applet`, and `npm test` to verify zero regression.
