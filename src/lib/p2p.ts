import { v4 as uuidv4 } from "uuid";

// Simple WebRTC Wrapper
export interface PeerConnection {
	id: string; // Connection ID
	pc: RTCPeerConnection;
	dc?: RTCDataChannel;
}

type SignalCallback = (targetId: string, signal: any) => void;
type MessageCallback = (fromId: string, data: any) => void;
type ConnectionCallback = (peerId: string, connected: boolean) => void;

export class P2PManager {
	private peers: Map<string, PeerConnection> = new Map();
	private onSignal: SignalCallback;
	private onMessage: MessageCallback;
	private onConnection: ConnectionCallback;
	constructor(
		_myId: string,
		onSignal: SignalCallback,
		onMessage: MessageCallback,
		onConnection: ConnectionCallback,
	) {
		this.onSignal = onSignal;
		this.onMessage = onMessage;
		this.onConnection = onConnection;
	}

	setHandlers(
		onSignal: SignalCallback,
		onMessage: MessageCallback,
		onConnection: ConnectionCallback,
	) {
		this.onSignal = onSignal;
		this.onMessage = onMessage;
		this.onConnection = onConnection;
	}

	// Create an Offer (Atomic: Waits for ICE gathering to complete)
	async createConnection(targetId: string = uuidv4()): Promise<string> {
		const pc = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		});

		const conn: PeerConnection = { id: targetId, pc };
		this.peers.set(targetId, conn);

		// Setup Data Channel
		const dc = pc.createDataChannel("game-data");
		this.setupDataChannel(dc, conn);
		this.setupPeerConnection(pc, conn);
		conn.dc = dc;

		// Handle ICE candidates (internally wait)

		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);

		// Wait for ICE gathering to complete
		await this.waitForIceGathering(pc);

		// Once complete, localDescription contains all candidates
		this.onSignal(targetId, { type: "offer", sdp: pc.localDescription });

		return targetId;
	}

	// Handle Incoming Signal
	async handleSignal(targetId: string, signal: any) {
		let conn = this.peers.get(targetId);

		if (!conn) {
			// Incoming connection (Answer side)
			const pc = new RTCPeerConnection({
				iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
			});
			conn = { id: targetId, pc };
			this.peers.set(targetId, conn);

			pc.ondatachannel = (event) => {
				const currentConn = this.peers.get(targetId);
				if (currentConn) {
					this.setupDataChannel(event.channel, currentConn);
					currentConn.dc = event.channel;
				}
			};
			this.setupPeerConnection(pc, conn);
		}

		const pc = conn.pc;

		if (signal.type === "offer") {
			await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);

			// Wait for ICE gathering to complete
			await this.waitForIceGathering(pc);

			this.onSignal(targetId, { type: "answer", sdp: pc.localDescription });
		} else if (signal.type === "answer") {
			// Logic for answer: setRemoteDescription
			// But check state first? No, just set it.
			if (pc.signalingState === "stable") {
				console.warn("Connection already stable. Ignoring answer (duplicate?)");
				return;
			}
			await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
		}
	}

	private waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
		return new Promise((resolve) => {
			if (pc.iceGatheringState === "complete") {
				resolve();
			} else {
				const check = () => {
					if (pc.iceGatheringState === "complete") {
						pc.removeEventListener("icegatheringstatechange", check);
						resolve();
					}
				};
				pc.addEventListener("icegatheringstatechange", check);

				// Timeout fallback (2 seconds)
				setTimeout(() => {
					resolve();
				}, 2000);
			}
		});
	}

	private setupPeerConnection(pc: RTCPeerConnection, conn: PeerConnection) {
		pc.onconnectionstatechange = () => {
			console.log(`Connection state for ${conn.id}: ${pc.connectionState}`);
			if (pc.connectionState === "failed" || pc.connectionState === "closed") {
				this.onConnection(conn.id, false);
			}
		};
	}

	private setupDataChannel(dc: RTCDataChannel, conn: PeerConnection) {
		dc.onopen = () => {
			console.log(`Data Channel Open with ${conn.id}`);
			this.onConnection(conn.id, true);
		};
		dc.onclose = () => {
			console.log(`Data Channel Closed with ${conn.id}`);
			this.onConnection(conn.id, false);
		};
		dc.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				this.onMessage(conn.id, data);
			} catch (e) {
				console.error("Failed to parse message", e);
			}
		};
	}

	broadcast(message: any) {
		const msgStr = JSON.stringify(message);
		console.log(`[P2P] Broadcasting message: ${message.type}`, message);
		if (this.peers.size === 0) {
			console.warn("[P2P] No peers to broadcast to!");
		}
		this.peers.forEach((conn) => {
			if (conn.dc && conn.dc.readyState === "open") {
				console.log(`[P2P] Sending to peer: ${conn.id}`);
				conn.dc.send(msgStr);
			} else {
				console.warn(
					`[P2P] Cannot send to ${conn.id}: DC state is ${conn.dc?.readyState || "null"}`,
				);
			}
		});
	}

	renamePeer(oldId: string, newId: string) {
		const conn = this.peers.get(oldId);
		if (conn) {
			if (this.peers.has(newId)) {
				console.warn(`Cannot rename to ${newId}, ID already exists.`);
				return;
			}
			this.peers.delete(oldId);
			conn.id = newId;
			this.peers.set(newId, conn);

			console.log(`Renamed peer connection ${oldId} -> ${newId}`);
		}
	}
}
