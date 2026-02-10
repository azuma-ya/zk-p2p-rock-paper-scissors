import { useEffect, useState } from "react";
// Components
import { EventLog } from "../components/EventLog";
import { GameArea } from "../components/GameArea";
import { IdentityCard } from "../components/IdentityCard";
import { Lobby } from "../components/Lobby";
import {
	generateKeyPair,
	generateNonce,
	hashHand,
	initCrypto,
	pubKeyToField,
	signMessage,
	verifySignature,
} from "../lib/crypto";
import { P2PManager } from "../lib/p2p";
import { useGameStore } from "../lib/store";
import { GameMessageSchema } from "../lib/types";
import { generateHandProof, verifyHandProof } from "../lib/zk";

let p2p: P2PManager | null = null;

export const GamePage = () => {
	const {
		myId,
		myPubKey,
		myPrivKey,
		setIdentity,
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
	}, [myPrivKey, setIdentity]);

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
					setSignalingStatus(`Signal Generated (${signal.type})`);
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
								const payload = parsed.payload as {
									proof: unknown;
									publicSignals: unknown;
									hand: number;
								};
								const revealedHand = payload.hand;
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
	}, [myId, addLog, setPeerCommit, setPeerReveal]);

	// Check Win Condition
	useEffect(() => {
		if (revealed && hand !== null) {
			// Find opponent
			const opponentId = Object.keys(peers)[0]; // 1v1 for now
			const opponent = peers[opponentId];
			if (opponent?.verified && opponent.revealedHand !== undefined) {
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

	const createOffer = async () => {
		if (!p2p) return;
		setSignalData("");
		setSignalingStatus("Generating Offer...");
		const id = await p2p.createConnection(targetPeerId || undefined);
		if (!targetPeerId) setTargetPeerId(id);
		addPeer(id, "Connecting...");
	};

	const acceptSignal = async () => {
		if (!p2p || !signalData) return;
		try {
			const decoded = JSON.parse(atob(signalData));
			if (decoded.senderId === myId) {
				alert("You cannot accept your own signal.");
				return;
			}
			setSignalingStatus("Processing Signal...");
			const remotePeerId = decoded.senderId || targetPeerId;
			if (!remotePeerId) throw new Error("Unknown Sender ID");

			setTargetPeerId(remotePeerId);

			if (decoded.signal?.type === "offer") {
				setTargetPeerId(remotePeerId);
				await p2p.handleSignal(remotePeerId, decoded.signal);
				setSignalingStatus("Offer Accepted. Copy the answer!");
				addPeer(remotePeerId, "Connected");
			} else if (decoded.signal?.type === "answer") {
				const tempId = targetPeerId;
				if (tempId && tempId !== remotePeerId) {
					await p2p.handleSignal(tempId, decoded.signal);
					p2p.renamePeer(tempId, remotePeerId);
					removePeer(tempId);
					addPeer(remotePeerId, "Connected");
					setTargetPeerId(remotePeerId);
				} else {
					await p2p.handleSignal(remotePeerId, decoded.signal);
					addPeer(remotePeerId, "Connected");
				}
				setSignalingStatus("Answer Accepted. Connected!");
				setSignalData("");
			}
		} catch (e) {
			console.error("Signal Error", e);
			alert("Invalid Signal Data");
			setSignalingStatus("Error processing signal");
		}
	};

	const sendHandVal = async () => {
		if (hand === null || !myPubKey || !myPrivKey || !p2p) return;

		const r = generateNonce();
		setNonce(r);
		const pubKeyHash = pubKeyToField(myPubKey);

		const commit = hashHand(hand, r, pubKeyHash, round);

		const msg = {
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
				round: round,
				timestamp: Date.now(),
				senderId: myId,
				senderPubKey: myPubKey,
				type: "HAND_PROOF" as const,
				payload: {
					proof,
					publicSignals,
					hand: hand,
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

	const allPeersCommitted =
		Object.values(peers).length > 0 &&
		Object.values(peers).every((p) => p.committed);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
			<div className="space-y-6">
				<IdentityCard myId={myId} />
				<Lobby
					targetPeerId={targetPeerId}
					setTargetPeerId={setTargetPeerId}
					createOffer={createOffer}
					signalingStatus={signalingStatus}
					signalData={signalData}
					setSignalData={setSignalData}
					acceptSignal={acceptSignal}
					peers={peers}
				/>
			</div>

			<div className="space-y-6">
				{Object.keys(peers).length > 0 ? (
					<GameArea
						round={round}
						hand={hand}
						setHand={setHand}
						committed={committed}
						revealed={revealed}
						sendHandVal={sendHandVal}
						proveHand={proveHand}
						gameResult={gameResult}
						nextRound={nextRound}
						proofStatus={proofStatus}
						opponentReady={allPeersCommitted}
					/>
				) : (
					<div className="p-12 border-2 border-dashed border-slate-200 rounded-lg bg-white flex flex-col items-center justify-center text-center space-y-6 h-full min-h-75">
						<div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl grayscale opacity-50">
							🕹️
						</div>
						<div className="space-y-2">
							<h3 className="text-xl font-bold tracking-tight">
								Connection Required
							</h3>
							<p className="text-sm text-muted-foreground max-w-50 mx-auto">
								Establish a connection via the lobby to access the secure game
								environment.
							</p>
						</div>
					</div>
				)}
				<EventLog logs={logs} />
			</div>
		</div>
	);
};
