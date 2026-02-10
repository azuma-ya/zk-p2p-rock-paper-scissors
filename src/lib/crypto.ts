import * as ed from "@noble/ed25519";
import { buildPoseidon } from "circomlibjs";

let poseidon: any = null;

export async function initCrypto() {
	if (!poseidon) {
		poseidon = await buildPoseidon();
	}
}

export async function generateKeyPair() {
	// Fix: Use window.crypto instead of ed.utils.randomPrivateKey which might be missing/changed
	const priv = window.crypto.getRandomValues(new Uint8Array(32));
	const pub = await ed.getPublicKeyAsync(priv);
	return {
		privateKey: ed.etc.bytesToHex(priv),
		publicKey: ed.etc.bytesToHex(pub),
	};
}

export async function signMessage(
	message: object,
	privateKeyHex: string,
): Promise<string> {
	const msgStr = JSON.stringify(message);
	const msgBytes = new TextEncoder().encode(msgStr);

	// Fix: Convert hex string back to Uint8Array for signing
	const privBytes = ed.etc.hexToBytes(privateKeyHex);

	const sig = await ed.signAsync(msgBytes, privBytes);
	return ed.etc.bytesToHex(sig);
}

export async function verifySignature(
	message: object,
	signatureHex: string,
	publicKeyHex: string,
): Promise<boolean> {
	const msgStr = JSON.stringify(message);
	const msgBytes = new TextEncoder().encode(msgStr);

	// Fix: Convert hex strings back to Uint8Array for verification
	const sigBytes = ed.etc.hexToBytes(signatureHex);
	const pubBytes = ed.etc.hexToBytes(publicKeyHex);

	return await ed.verifyAsync(sigBytes, msgBytes, pubBytes);
}

export function hashHand(
	hand: number,
	nonce: string,
	pubKeyHash: string,
	round: number,
): string {
	if (!poseidon) throw new Error("Crypto not initialized");

	// Convert inputs to BigInt
	const inputs = [
		BigInt(hand),
		BigInt(nonce),
		BigInt(pubKeyHash),
		BigInt(round),
	];

	const hash = poseidon(inputs);
	return poseidon.F.toString(hash);
}

export function hashRandom(randomVal: string): string {
	if (!poseidon) throw new Error("Crypto not initialized");
	const hash = poseidon([BigInt(randomVal)]);
	return poseidon.F.toString(hash);
}

export function pubKeyToField(pubKeyHex: string): string {
	const sliced = pubKeyHex.slice(0, 62);
	return BigInt("0x" + sliced).toString();
}

export function generateNonce(): string {
	const random = window.crypto.getRandomValues(new Uint8Array(31));
	return BigInt("0x" + ed.etc.bytesToHex(random)).toString();
}
