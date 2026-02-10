# ZK P2P Rock-Paper-Scissors

A serverless, peer-to-peer Rock-Paper-Scissors game using Zero-Knowledge Proofs (Groth16) for move integrity.

## Prerequisites

- `bun` (Runtime & Package Manager)
- `circom` (for circuit compilation, script will attempt to download automatically if missing)

## Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Build Circuits (Compile .circom, generate Trusted Setup keys):

   ```bash
   bun scripts/build_circuits.ts
   ```

   > **Note**: This generates a local trusted setup (Powers of Tau) for testing. Do not use for production.

3. Run Development Server:
   ```bash
   bun dev
   ```

## How to Play

1. Open the app in two different browser windows/tabs (or devices on same network if configured).
2. **Tab A**: Enter a Room ID (e.g. `room1`) and Join.
3. **Tab B**: Enter the same Room ID and Join.
   > Only specific Room ID logic is implemented for event tagging, but P2P connection needs manual signaling.
4. **Signaling (Manual P2P Connection)**:
   - **Tab A**: Click "Connect (Generate Offer)". A JSON blob will appear in "Signal Data". Copy it.
   - **Tab B**: Paste the blob into "Signal Data" and click "Accept Signal". A new JSON blob (Answer) will be generated/logged.
   - **Tab A**: (If implementation supports full copy-paste flow): Implementing full copy-paste flow for 2-way handshake manually is tedious.

   **Simplified Flow (Implemented)**:
   - **A**: Generates Offer. Copy JSON.
   - **B**: Pastes Offer. Code detects it's an Offer. Generates Answer. **Copy Answer JSON**.
   - **A**: Pastes Answer. Code detects Answer. Connection Established.

5. **Game Round**:
   - Both players start in a "Global" state (Room ID helps isolate logs logically).
   - Select a Hand (Rock/Paper/Scissors).
   - Click "Commit Hand". This broadcasts a Hash + Signature.
   - Once both committed (or whenever ready), click "Reveal & Prove".
   - This generates a ZK Proof that "I know a hand that matches the hash I sent earlier".
   - Peers verify the proof and show "Proof Verified".

## Architecture

- **Frontend**: React + Vite
- **P2P**: WebRTC DataChannels (Mesh)
- **ZKP**: SnarkJS + Circom (C++ / WASM)
- **Crypto**: Ed25519 Signatures, Poseidon Hash
- **Storage**: Zustand (In-memory) + (Optional Persistence)

## Directory Structure

- `circuits/`: ZK Circuits
- `scripts/`: Build tools
- `src/lib/`: Core logic (Crypto, P2P, ZK, Types)
- `public/circuits/`: Generated WASM/Key files
