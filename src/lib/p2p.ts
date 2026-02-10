import { v4 as uuidv4 } from "uuid";

// Simple WebRTC Wrapper
export interface PeerConnection {
	id: string; // Connection ID
	pc: RTCPeerConnection;
	dc?: RTCDataChannel;
}

type SignalCallback = (targetId: string, signal: any) => void;
type MessageCallback = (fromId: string, data: any) => void;

export class P2PManager {
	private peers: Map<string, PeerConnection> = new Map();
	private onSignal: SignalCallback;
	private onMessage: MessageCallback;
	private myId: string;

	constructor(
		myId: string,
		onSignal: SignalCallback,
		onMessage: MessageCallback,
	) {
		this.myId = myId;
		this.onSignal = onSignal;
		this.onMessage = onMessage;
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
		this.setupDataChannel(dc, targetId);
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
				this.setupDataChannel(event.channel, targetId);
				conn!.dc = event.channel;
			};
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

	private setupDataChannel(dc: RTCDataChannel, peerId: string) {
		dc.onopen = () => {
			console.log(`Data Channel Open with ${peerId}`);
		};
		dc.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				this.onMessage(peerId, data);
			} catch (e) {
				console.error("Failed to parse message", e);
			}
		};
	}

	broadcast(message: any) {
		const msgStr = JSON.stringify(message);
		this.peers.forEach((conn) => {
			if (conn.dc && conn.dc.readyState === "open") {
				conn.dc.send(msgStr);
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

			// Update DC callback closures?
			// No, because onmessage uses `peerId` variable from closure scope.
			// We need to update the data channel handler?
			// Actually, the closure `peerId` in setupDataChannel cannot be changed easily.
			// But we can just rely on the fact that `onMessage` is callled.
			// The `peerId` passed to `onMessage` will be the OLD one if we don't fix it.

			// Fix: Re-assign onmessage to use new ID.
			if (conn.dc) {
				const dc = conn.dc;
				dc.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data);
						this.onMessage(newId, data); // Use NEW ID
					} catch (e) {
						console.error(e);
					}
				};
			}
			// If it was valid usage, `setupDataChannel` logic needs to be robust.
			// But for MVP this is enough.

			console.log(`Renamed peer connection ${oldId} -> ${newId}`);
		}
	}
}
