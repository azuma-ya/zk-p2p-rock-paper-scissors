// --- Base Types ---
export type PubKey = string; // Hex string
export type Signature = string; // Hex string
export type Hash = string; // BigInt string or Hex? internal circom uses string arithmetic usually, but we'll use string for transport.

// --- Message Envelopes ---
export type MessageType =
	| "SIGNAL"
	| "ROUND_COMMIT"
	| "ROUND_REVEAL"
	| "HAND_COMMIT"
	| "HAND_PROOF"
	| "EVENT_GOSSIP"
	| "NEXT_ROUND";

export interface BaseMessage {
	round: number;
	timestamp: number;
	senderId: string; // uuid
	senderPubKey: PubKey;
	signature: Signature; // Signature of the payload (or whole message excluding signature)
	type: MessageType;
}

// --- Payloads ---

// 2. SIGNAL (WebRTC)
export interface SignalPayload extends BaseMessage {
	type: "SIGNAL";
	payload: {
		targetPeerId: string;
		signal: any; // Offer/Answer/Candidate
	};
}

// 3. ROUND_COMMIT (Random seed generation step 1)
export interface RoundCommitPayload extends BaseMessage {
	type: "ROUND_COMMIT";
	payload: {
		commitHash: Hash;
	};
}

// 4. ROUND_REVEAL (Random seed generation step 2)
export interface RoundRevealPayload extends BaseMessage {
	type: "ROUND_REVEAL";
	payload: {
		randomValue: string;
	};
}

// 5. HAND_COMMIT (Player moves)
export interface HandCommitPayload extends BaseMessage {
	type: "HAND_COMMIT";
	payload: {
		handCommit: Hash;
	};
}

// 6. HAND_PROOF (Player proves move valid)
export interface HandProofPayload extends BaseMessage {
	type: "HAND_PROOF";
	payload: {
		proof: any; // Groth16 proof object
		publicSignals: string[];
		hand?: number;
	};
}

// 7. EVENT_GOSSIP (Log sync)
export interface GossipPayload extends BaseMessage {
	type: "EVENT_GOSSIP";
	payload: {
		events: any[]; // Array of signed events
	};
}

// 8. NEXT_ROUND (Sync round transition)
export interface NextRoundPayload extends BaseMessage {
	type: "NEXT_ROUND";
	payload: Record<string, never>;
}

export type GameMessage =
	| SignalPayload
	| RoundCommitPayload
	| RoundRevealPayload
	| HandCommitPayload
	| HandProofPayload
	| GossipPayload
	| NextRoundPayload;
