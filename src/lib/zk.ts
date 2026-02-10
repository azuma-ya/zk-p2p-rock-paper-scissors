import * as snarkjs from "snarkjs";

const WASM_PATH = "/circuits/hand_integrity.wasm";
const ZKEY_PATH = "/circuits/hand_integrity_final.zkey";
// VKey is usually small enough to bundle or fetch JSON
const VKEY_PATH = "/circuits/verification_key.json";

export async function generateHandProof(
	hand: number,
	nonce: string,
	playerPubKeyHash: string,
	round: number,
	handCommit: string,
) {
	const inputs = {
		hand,
		nonce,
		playerPubKeyHash,
		roundNumber: round,
		handCommit,
	};

	const { proof, publicSignals } = await snarkjs.groth16.fullProve(
		inputs,
		// Note: Vite dev server serves from public/ at root
		WASM_PATH,
		ZKEY_PATH,
	);

	return { proof, publicSignals };
}

export async function verifyHandProof(
	proof: any,
	publicSignals: any,
): Promise<boolean> {
	// Fetch verification key if not cached (simple fetch for now)
	const vkey = await fetch(VKEY_PATH).then((res) => res.json());

	const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
	return verified;
}
