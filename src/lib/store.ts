import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import type { GameMessage } from "./types";

interface GameState {
	roomId: string | null;
	myId: string;
	myPubKey: string | null;
	myPrivKey: string | null;

	peers: Record<
		string,
		{
			id: string;
			pubKey?: string;
			description: string;
			// Game State
			committed: boolean;
			revealedHand?: number; // 0,1,2
			verified: boolean;
		}
	>;

	logs: GameMessage[];

	round: number;
	playerRole: "player" | "verifier";

	// Game Actions
	setIdentity: (priv: string, pub: string) => void;
	joinRoom: (roomId: string) => void;
	addPeer: (id: string, desc: string) => void;
	removePeer: (id: string) => void;
	setPeerCommit: (id: string, val: boolean) => void;
	setPeerReveal: (id: string, hand: number) => void;
	addLog: (msg: GameMessage) => void;
	resetRound: () => void;

	// Ephemeral State
	isThinking: boolean;
	gameStatus: string;
}

export const useGameStore = create<GameState>((set) => ({
	roomId: null,
	myId: uuidv4(),
	myPubKey: null,
	myPrivKey: null,

	peers: {},
	logs: [],

	round: 1,
	playerRole: "player",

	isThinking: false,
	gameStatus: "INIT",

	setIdentity: (priv, pub) => set({ myPrivKey: priv, myPubKey: pub }),

	joinRoom: (roomId) => set({ roomId }),

	addPeer: (id, desc) =>
		set((state) => ({
			peers: {
				...state.peers,
				[id]: {
					...state.peers[id],
					id,
					description: desc,
					committed: state.peers[id]?.committed || false,
					verified: state.peers[id]?.verified || false,
				},
			},
		})),

	removePeer: (id) =>
		set((state) => {
			const newPeers = { ...state.peers };
			delete newPeers[id];
			return { peers: newPeers };
		}),

	setPeerCommit: (id, val) =>
		set((state) => ({
			peers: {
				...state.peers,
				[id]: { ...state.peers[id], committed: val },
			},
		})),

	setPeerReveal: (id, hand) =>
		set((state) => ({
			peers: {
				...state.peers,
				[id]: { ...state.peers[id], revealedHand: hand, verified: true },
			},
		})),

	addLog: (msg) => set((state) => ({ logs: [...state.logs, msg] })),

	resetRound: () =>
		set((state) => {
			const resetPeers = { ...state.peers };
			for (const id in resetPeers) {
				resetPeers[id] = {
					...resetPeers[id],
					committed: false,
					revealedHand: undefined,
					verified: false,
				};
			}
			return {
				round: state.round + 1,
				peers: resetPeers,
				logs: [],
			};
		}),
}));
