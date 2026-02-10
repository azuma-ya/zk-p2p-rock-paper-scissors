import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import type { GameMessage } from "./types";

export interface PeerState {
	id: string;
	pubKey?: string;
	description: string;
	// Game State
	committed: boolean;
	revealedHand?: number; // 0,1,2
	verified: boolean;
	isConnected: boolean;
}

interface GameState {
	myId: string;
	myPubKey: string | null;
	myPrivKey: string | null;

	peers: Record<string, PeerState>;

	logs: GameMessage[];

	round: number;
	playerRole: "player" | "verifier";

	// Game Actions
	setIdentity: (priv: string, pub: string) => void;
	addPeer: (id: string, desc: string) => void;
	removePeer: (id: string) => void;
	setPeerCommit: (id: string, val: boolean) => void;
	setPeerReveal: (id: string, hand: number) => void;
	setPeerConnected: (id: string, val: boolean) => void;
	addLog: (msg: GameMessage) => void;
	resetRound: () => void;

	// Ephemeral State
	isThinking: boolean;
	gameStatus: string;
}

export const useGameStore = create<GameState>((set) => ({
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
					isConnected: state.peers[id]?.isConnected || false,
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
		set((state) => {
			if (!state.peers[id]) return state;
			return {
				peers: {
					...state.peers,
					[id]: { ...state.peers[id], committed: val },
				},
			};
		}),

	setPeerReveal: (id, hand) =>
		set((state) => {
			if (!state.peers[id]) return state;
			return {
				peers: {
					...state.peers,
					[id]: { ...state.peers[id], revealedHand: hand, verified: true },
				},
			};
		}),

	setPeerConnected: (id, val) =>
		set((state) => {
			if (!state.peers[id]) return state;
			return {
				peers: {
					...state.peers,
					[id]: { ...state.peers[id], isConnected: val },
				},
			};
		}),

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
