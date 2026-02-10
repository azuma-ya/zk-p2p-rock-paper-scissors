import fs from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";

const CIRCUITS_DIR = "circuits";
const BUILD_DIR = "public/circuits"; // We put artifacts here so they can be fetched by the frontend

async function main() {
	console.log("🚀 Starting Circuit Build...");

	// Ensure build directory exists
	await $`mkdir -p ${BUILD_DIR}`;

	// Check if circom is installed
	let circomCmd = "circom";
	try {
		await $`circom --version`.quiet();
	} catch (e) {
		console.log(
			"⚠️ 'circom' not found in PATH. Attempting to download local binary...",
		);
		// circom-linux-amd64
		const circomUrl =
			"https://github.com/iden3/circom/releases/download/v2.1.8/circom-linux-amd64";
		const localCircomPath = path.join(process.cwd(), "circom");

		if (!(await fs.exists(localCircomPath))) {
			// Use verify if curl exists
			try {
				await $`which curl`.quiet();
				console.log(`Downloading from ${circomUrl}...`);
				await $`curl -L -o ${localCircomPath} ${circomUrl}`;
				await $`chmod +x ${localCircomPath}`;
			} catch (curlErr) {
				console.error(
					"❌ 'curl' is not installed. Please install 'circom' manually or install 'curl'.",
				);
				process.exit(1);
			}
		}
		circomCmd = localCircomPath;
	}

	// 1. Compile Circuit
	console.log("Compiling circuit...");
	try {
		await $`${circomCmd} ${CIRCUITS_DIR}/hand_integrity.circom --r1cs --wasm --sym --output ${BUILD_DIR}`;
	} catch (err) {
		console.error("❌ Compilation failed.");
		// Just in case permissions are weird or something
		try {
			await $`chmod +x ${circomCmd}`;
			await $`${circomCmd} ${CIRCUITS_DIR}/hand_integrity.circom --r1cs --wasm --sym --output ${BUILD_DIR}`;
		} catch (retryErr) {
			console.error("Retry failed:", retryErr);
			if (!(await fs.exists(path.join(BUILD_DIR, "hand_integrity_js")))) {
				process.exit(1);
			}
		}
	}

	// Move the wasm file to the build root for easier access
	const wasmDir = path.join(BUILD_DIR, "hand_integrity_js");
	const wasmFile = path.join(wasmDir, "hand_integrity.wasm");
	const targetWasm = path.join(BUILD_DIR, "hand_integrity.wasm");

	if (await fs.exists(wasmFile)) {
		await $`mv ${wasmFile} ${targetWasm}`;
		await $`rm -rf ${wasmDir}`;
	}

	// 2. Trusted Setup (Groth16)
	console.log("Generating Trusted Setup (Powers of Tau)...");

	const ptauFinal = path.join(BUILD_DIR, "pot12_final.ptau");
	const r1cs = path.join(BUILD_DIR, "hand_integrity.r1cs");
	const zkey = path.join(BUILD_DIR, "hand_integrity_0000.zkey");
	const finalZkey = path.join(BUILD_DIR, "hand_integrity_final.zkey");
	const vkey = path.join(BUILD_DIR, "verification_key.json");

	// Use absolute path or relative path to node_modules binary
	const snarkjsPath = path.join(
		process.cwd(),
		"node_modules",
		".bin",
		"snarkjs",
	);

	if (!(await fs.exists(ptauFinal))) {
		console.log("Creating Powers of Tau...");
		const ptau0 = path.join(BUILD_DIR, "pot12_0000.ptau");
		const ptau1 = path.join(BUILD_DIR, "pot12_0001.ptau");

		await $`${snarkjsPath} powersoftau new bn128 12 ${ptau0}`;
		await $`${snarkjsPath} powersoftau contribute ${ptau0} ${ptau1} --name="First contribution" -v -e="random_entropy_text_12345"`;

		console.log("Preparing Phase 2...");
		await $`${snarkjsPath} powersoftau prepare phase2 ${ptau1} ${ptauFinal} -v`;

		await $`rm ${ptau0} ${ptau1}`;
	}

	// 3. Phase 2 (Circuit Specific)
	console.log("Generating ZKey...");
	// Check if r1cs exists
	if (!(await fs.exists(r1cs))) {
		console.error("❌ R1CS file not found. Compilation likely failed.");
		process.exit(1);
	}

	await $`${snarkjsPath} groth16 setup ${r1cs} ${ptauFinal} ${zkey}`;

	console.log("Contributing to Phase 2...");
	await $`${snarkjsPath} zkey contribute ${zkey} ${finalZkey} --name="Second contribution" -v -e="another_random_entropy_string"`;
	await $`rm ${zkey}`;

	console.log("Exporting Verification Key...");
	await $`${snarkjsPath} zkey export verificationkey ${finalZkey} ${vkey}`;

	console.log("✅ Build Complete!");
}

main().catch(console.error);
