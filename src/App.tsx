import { useEffect, useState } from "react";
import {
	generateKeyPair,
	generateNonce,
	hashHand,
	initCrypto,
	pubKeyToField,
	signMessage,
	verifySignature,
} from "./lib/crypto";
import { P2PManager } from "./lib/p2p";
import { useGameStore } from "./lib/store";
import { GameMessageSchema } from "./lib/types";
import { generateHandProof, verifyHandProof } from "./lib/zk";

// -- Vanilla CSS Styles --
const styles = {
	container: {
		maxWidth: "800px",
		margin: "0 auto",
		padding: "20px",
		fontFamily: "sans-serif",
	},
	card: {
		border: "1px solid #ccc",
		padding: "15px",
		borderRadius: "8px",
		marginBottom: "15px",
	},
	btn: {
		padding: "8px 16px",
		background: "#333",
		color: "#fff",
		border: "none",
		borderRadius: "4px",
		cursor: "pointer",
		marginRight: "5px",
	},
	input: {
		padding: "8px",
		marginRight: "5px",
		borderRadius: "4px",
		border: "1px solid #ddd",
	},
	log: {
		background: "#f5f5f5",
		padding: "10px",
		height: "200px",
		overflowY: "scroll",
		fontFamily: "monospace",
		fontSize: "12px",
	},
	status: { fontWeight: "bold" as const, marginBottom: "10px" },
	winner: {
		fontSize: "24px",
		fontWeight: "bold",
		color: "green",
		textAlign: "center" as const,
		margin: "20px 0",
	},
};

let p2p: P2PManager | null = null;

function App() {
	const {
		myId,
		myPubKey,
		myPrivKey,
		setIdentity,
		roomId,
		joinRoom,
		logs,
		addLog,
		peers,
		addPeer,
		removePeer,
		setPeerCommit,
		setPeerReveal,
		resetRound,
		round,
	} = useGameStore();

	const [targetPeerId, setTargetPeerId] = useState("");
	const [signalData, setSignalData] = useState("");
	const [inputRoom, setInputRoom] = useState("");

	// Game State
	const [hand, setHand] = useState<number | null>(null); // 0,1,2
	const [committed, setCommitted] = useState(false);
	const [revealed, setRevealed] = useState(false);
	const [nonce, setNonce] = useState<string>("");
	const [proofStatus, setProofStatus] = useState<string>("");
	const [signalingStatus, setSignalingStatus] = useState("");
	const [gameResult, setGameResult] = useState<string>("");

	useEffect(() => {
		initCrypto().then(async () => {
			if (!myPrivKey) {
				try {
					const kp = await generateKeyPair();
					setIdentity(kp.privateKey, kp.publicKey);
					console.log("Identity generated:", kp.publicKey);
				} catch (e) {
					console.error("Failed to generate identity", e);
				}
			}
		});
	}, []);

	useEffect(() => {
		if (myId && !p2p) {
			console.log("Initializing P2P Manager...");
			p2p = new P2PManager(
				myId,
				(target, signal) => {
					console.log("SIGNAL Generated for", target, signal.type);
					const payload = {
						target,
						senderId: myId,
						signal,
					};
					const encoded = btoa(JSON.stringify(payload));
					setSignalData(encoded);
					setSignalingStatus(
						`Signal Generated (${signal.type}). Copy it below.`,
					);
				},
				async (from, data) => {
					console.log("MSG from", from, data);

					try {
						const parsed = GameMessageSchema.parse(data);

						// Verify Signature
						const isValid = await verifySignature(
							{ ...parsed, signature: undefined },
							parsed.signature,
							parsed.senderPubKey,
						);

						if (!isValid) {
							console.error("Invalid Signature from", from);
							return;
						}

						addLog(parsed);

						// Handle specific logic
						if (parsed.type === "HAND_COMMIT") {
							setPeerCommit(parsed.senderId, true);
						} else if (parsed.type === "HAND_PROOF") {
							const ver = await verifyHandProof(
								parsed.payload.proof,
								parsed.payload.publicSignals,
							);
							if (ver) {
								console.log(`Proof Verified for ${parsed.senderId}!`);

								// Extract hand from payload (sent in plaintext along with proof for MVP logic)
								const revealedHand = (parsed.payload as any).hand;
								if (revealedHand !== undefined) {
									setPeerReveal(parsed.senderId, revealedHand);
								}
							} else {
								alert(`Proof FAILED for ${parsed.senderId}!`);
							}
						}
					} catch (e) {
						console.error("Invalid Message", e);
					}
				},
			);
		}
	}, [myId]);

	// Check Win Condition
	useEffect(() => {
		if (revealed && hand !== null) {
			// Find opponent
			const opponentId = Object.keys(peers)[0]; // 1v1 for now
			const opponent = peers[opponentId];
			if (
				opponent &&
				opponent.verified &&
				opponent.revealedHand !== undefined
			) {
				// Determine winner
				const myH = hand;
				const opH = opponent.revealedHand;

				let res = "Draw";
				if (myH === opH) {
					res = "Draw";
				} else if ((myH - opH + 3) % 3 === 1) {
					res = "You WIN!";
				} else {
					res = "You LOSE!";
				}

				setGameResult(
					`${res} (You: ${["Rock", "Paper", "Scissors"][myH]}, Opponent: ${["Rock", "Paper", "Scissors"][opH]})`,
				);
			}
		}
	}, [revealed, hand, peers]);

	const handleJoin = () => {
		joinRoom(inputRoom);
	};

	const createOffer = async () => {
		if (!p2p) return;
		setSignalData("");
		setSignalingStatus("Generating Offer... (Waiting for ICE)");
		const id = await p2p.createConnection(targetPeerId || undefined);
		if (!targetPeerId) setTargetPeerId(id);
		addPeer(id, "Connecting...");
	};

	const acceptSignal = async () => {
		if (!p2p || !signalData) return;
		try {
			const decoded = JSON.parse(atob(signalData));
			if (decoded.senderId === myId) {
				alert(
					"You are trying to accept your own signal. Ask the other peer for their signal.",
				);
				return;
			}
			setSignalingStatus("Processing Signal...");
			const remotePeerId = decoded.senderId || targetPeerId;
			if (!remotePeerId) throw new Error("Unknown Sender ID");

			setTargetPeerId(remotePeerId);

			if (decoded.signal?.type === "offer") {
				// We are accepting an offer
				setTargetPeerId(remotePeerId);
				await p2p.handleSignal(remotePeerId, decoded.signal || decoded);
				setSignalingStatus("Offer Accepted. Answer Generated below.");
				addPeer(remotePeerId, "Connected");
			} else if (decoded.signal?.type === "answer") {
				// Initiator logic with rename support if needed
				const tempId = targetPeerId;
				if (tempId && tempId !== remotePeerId) {
					await p2p.handleSignal(tempId, decoded.signal || decoded);
					p2p.renamePeer(tempId, remotePeerId);
					removePeer(tempId);
					addPeer(remotePeerId, "Connected");
					setTargetPeerId(remotePeerId);
				} else {
					await p2p.handleSignal(remotePeerId, decoded.signal || decoded);
					addPeer(remotePeerId, "Connected");
				}
				setSignalingStatus("Answer Accepted. Connection should open shortly.");
				setSignalData("");
			}
		} catch (e) {
			console.error("Signal Error", e);
			alert(
				"Invalid Signal Data: " + (e instanceof Error ? e.message : String(e)),
			);
			setSignalingStatus(
				"Error: " + (e instanceof Error ? e.message : String(e)),
			);
		}
	};

	const sendHandVal = async () => {
		if (hand === null || !myPubKey || !myPrivKey || !p2p) return;

		const r = generateNonce();
		setNonce(r);
		const pubKeyHash = pubKeyToField(myPubKey);

		const commit = hashHand(hand, r, pubKeyHash, round);

		const msg = {
			roomId: roomId || "global",
			round: round,
			timestamp: Date.now(),
			senderId: myId,
			senderPubKey: myPubKey,
			type: "HAND_COMMIT" as const,
			payload: {
				handCommit: commit,
			},
		};

		const sig = await signMessage(msg, myPrivKey);
		const signedMsg = { ...msg, signature: sig };

		p2p.broadcast(signedMsg);
		setCommitted(true);
		addLog(signedMsg);
	};

	const proveHand = async () => {
		if (hand === null || !nonce || !myPubKey || !myPrivKey || !p2p) return;
		setProofStatus("Generating Proof...");

		try {
			const pubKeyHash = pubKeyToField(myPubKey);
			const commit = hashHand(hand, nonce, pubKeyHash, round);

			const { proof, publicSignals } = await generateHandProof(
				hand,
				nonce,
				pubKeyHash,
				round,
				commit,
			);

			const msg = {
				roomId: roomId || "global",
				round: round,
				timestamp: Date.now(),
				senderId: myId,
				senderPubKey: myPubKey,
				type: "HAND_PROOF" as const,
				payload: {
					proof,
					publicSignals,
					hand: hand, // Sending Plaintext hand for game logic!
				},
			};

			const sig = await signMessage(msg, myPrivKey);
			const signedMsg = { ...msg, signature: sig };

			p2p.broadcast(signedMsg);
			addLog(signedMsg);
			setProofStatus("Proof Sent!");
			setRevealed(true);
		} catch (e) {
			console.error(e);
			setProofStatus("Proof Failed");
		}
	};

	const nextRound = () => {
		setHand(null);
		setCommitted(false);
		setRevealed(false);
		setNonce("");
		setProofStatus("");
		setGameResult("");
		resetRound();
	};

	return (
		<div style={styles.container}>
			<h1 style={{ textAlign: "center" }}>ZK P2P RPS</h1>

			{/* Identity */}
			<div style={styles.card}>
				<div style={styles.status}>My ID: {myId.slice(0, 8)}...</div>
			</div>

			{/* Room & Peers */}
			<div style={styles.card}>
				<h3>Lobby</h3>

				<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
					{!roomId && (
						<div>
							<input
								style={styles.input}
								placeholder="Room ID"
								value={inputRoom}
								onChange={(e) => setInputRoom(e.target.value)}
							/>
							<button style={styles.btn} onClick={handleJoin}>
								Join Room
							</button>
						</div>
					)}

					<div>
						<h4>Connection Manager</h4>
						<input
							style={{ ...styles.input, width: "200px" }}
							placeholder="Remote Peer ID (if known)"
							value={targetPeerId}
							onChange={(e) => setTargetPeerId(e.target.value)}
						/>
						<button style={styles.btn} onClick={createOffer}>
							Connect (Generate Offer)
						</button>
					</div>

					{signalingStatus && (
						<div style={{ color: "blue", fontSize: "0.9em" }}>
							{signalingStatus}
						</div>
					)}

					<textarea
						style={{ width: "100%", height: "60px", fontSize: "10px" }}
						placeholder="Signal Data (Copy/Paste here)"
						value={signalData}
						onChange={(e) => setSignalData(e.target.value)}
					/>

					<div>
						<button style={styles.btn} onClick={acceptSignal}>
							Accept Signal
						</button>
						<button
							style={styles.btn}
							onClick={() => navigator.clipboard.writeText(signalData)}
						>
							Copy Signal
						</button>
						<button style={styles.btn} onClick={() => setSignalData("")}>
							Clear Output
						</button>
					</div>
				</div>

				<h4>Peers ({Object.keys(peers).length})</h4>
				<ul>
					{Object.entries(peers).map(([id, p]) => (
						<li key={id}>
							{id.slice(0, 8)} | Status: {p.description || "Unknown"} | State:{" "}
							{p.committed ? "COMMITTED" : "THINKING"}
							{p.verified && " | REVEALED"}
						</li>
					))}
				</ul>
			</div>

			{/* Game Area */}
			{roomId && (
				<div style={styles.card}>
					<h3>Round {round}</h3>

					{gameResult ? (
						<div style={styles.winner}>
							{gameResult}
							<div style={{ marginTop: "10px" }}>
								<button style={styles.btn} onClick={nextRound}>
									Next Round
								</button>
							</div>
						</div>
					) : (
						<>
							<div
								style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
							>
								{[0, 1, 2].map((h) => (
									<button
										key={h}
										style={{
											...styles.btn,
											background: hand === h ? "#007bff" : "#333",
											opacity: committed && hand !== h ? 0.5 : 1,
										}}
										onClick={() => !committed && setHand(h)}
										disabled={committed}
									>
										{h === 0 ? "Rock" : h === 1 ? "Paper" : "Scissors"}
									</button>
								))}
							</div>

							<div>
								<button
									style={styles.btn}
									onClick={sendHandVal}
									disabled={committed || hand === null}
								>
									{committed ? "Hand Committed" : "Commit Hand"}
								</button>
								<button
									style={styles.btn}
									onClick={proveHand}
									disabled={
										!committed ||
										revealed ||
										Object.values(peers).length === 0 ||
										!Object.values(peers).every((p) => p.committed)
									}
								>
									{revealed ? "Revealed" : "Reveal & Prove"}
								</button>
							</div>

							{committed &&
								!revealed &&
								(Object.values(peers).length === 0 ||
									!Object.values(peers).every((p) => p.committed)) && (
									<div
										style={{
											color: "orange",
											marginTop: "10px",
											fontSize: "0.9em",
										}}
									>
										Waiting for opponent to commit...
									</div>
								)}
						</>
					)}

					{proofStatus && (
						<div style={{ marginTop: "10px" }}>My Status: {proofStatus}</div>
					)}
				</div>
			)}

			{/* Logs */}
			<div style={styles.card}>
				<h3>Event Log</h3>
				<div style={styles.log}>
					{logs.map((L, i) => (
						<div
							key={i}
							style={{ marginBottom: "5px", borderBottom: "1px solid #eee" }}
						>
							[{new Date(L.timestamp).toLocaleTimeString()}] <b>{L.type}</b>{" "}
							from {L.senderId.slice(0, 8)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default App;
