import { z } from "zod";

// --- Base Types ---
export const PubKeySchema = z.string(); // Hex string
export const SignatureSchema = z.string(); // Hex string
export const HashSchema = z.string(); // BigInt string or Hex? internal circom uses string arithmetic usually, but we'll use string for transport.

// --- Message Envelopes ---
export const MessageTypeSchema = z.enum([
	"JOIN",
	"SIGNAL",
	"ROUND_COMMIT",
	"ROUND_REVEAL",
	"HAND_COMMIT",
	"HAND_PROOF",
	"EVENT_GOSSIP",
]);

export const BaseMessageSchema = z.object({
	roomId: z.string(),
	round: z.number().int().nonnegative(),
	timestamp: z.number(),
	senderId: z.string(), // uuid
	senderPubKey: PubKeySchema,
	signature: SignatureSchema, // Signature of the payload (or whole message excluding signature)
});

// --- Payloads ---

// 1. JOIN
export const JoinPayloadSchema = z.object({
	type: z.literal("JOIN"),
	payload: z.object({
		// Additional join info if needed
	}),
});

// 2. SIGNAL (WebRTC)
export const SignalPayloadSchema = z.object({
	type: z.literal("SIGNAL"),
	payload: z.object({
		targetPeerId: z.string(),
		signal: z.any(), // Offer/Answer/Candidate
	}),
});

// 3. ROUND_COMMIT (Random seed generation step 1)
export const RoundCommitPayloadSchema = z.object({
	type: z.literal("ROUND_COMMIT"),
	payload: z.object({
		commitHash: HashSchema,
	}),
});

// 4. ROUND_REVEAL (Random seed generation step 2)
export const RoundRevealPayloadSchema = z.object({
	type: z.literal("ROUND_REVEAL"),
	payload: z.object({
		randomValue: z.string(),
	}),
});

// 5. HAND_COMMIT (Player moves)
export const HandCommitPayloadSchema = z.object({
	type: z.literal("HAND_COMMIT"),
	payload: z.object({
		handCommit: HashSchema,
	}),
});

// 6. HAND_PROOF (Player proves move valid)
export const HandProofPayloadSchema = z.object({
	type: z.literal("HAND_PROOF"),
	payload: z.object({
		proof: z.any(), // Groth16 proof object
		publicSignals: z.array(z.string()),
		hand: z.number().optional(),
	}),
});

// 7. EVENT_GOSSIP (Log sync)
export const GossipPayloadSchema = z.object({
	type: z.literal("EVENT_GOSSIP"),
	payload: z.object({
		events: z.array(z.any()), // Array of signed events
	}),
});

export const GameMessageSchema = z.intersection(
	BaseMessageSchema,
	z.discriminatedUnion("type", [
		JoinPayloadSchema,
		SignalPayloadSchema,
		RoundCommitPayloadSchema,
		RoundRevealPayloadSchema,
		HandCommitPayloadSchema,
		HandProofPayloadSchema,
		GossipPayloadSchema,
	]),
);

export type GameMessage = z.infer<typeof GameMessageSchema>;
export type MessageType = z.infer<typeof MessageTypeSchema>;
