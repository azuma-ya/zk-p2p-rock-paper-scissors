interface GameAreaProps {
	round: number;
	hand: number | null;
	setHand: (h: number) => void;
	committed: boolean;
	revealed: boolean;
	sendHandVal: () => void;
	proveHand: () => void;
	gameResult: string;
	nextRound: () => void;
	proofStatus: string;
	opponentReady: boolean;
}

export const GameArea = ({
	round,
	hand,
	setHand,
	committed,
	revealed,
	sendHandVal,
	proveHand,
	gameResult,
	nextRound,
	proofStatus,
	opponentReady,
}: GameAreaProps) => {
	const hands = [
		{ id: 0, name: "Rock", icon: "✊" },
		{ id: 1, name: "Paper", icon: "✋" },
		{ id: 2, name: "Scissors", icon: "✌️" },
	];

	return (
		<div className="p-6 bg-card border rounded-lg space-y-8">
			<div className="flex justify-between items-center border-b pb-4">
				<div>
					<h3 className="text-2xl font-bold tracking-tight">Round {round}</h3>
					<p className="text-sm text-muted-foreground">
						Select your move and commit.
					</p>
				</div>
				{proofStatus && (
					<div className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded uppercase tracking-tighter border">
						{proofStatus}
					</div>
				)}
			</div>

			{gameResult ? (
				<div className="flex flex-col items-center justify-center py-10 space-y-6 animate-in fade-in zoom-in duration-300">
					<div className="text-5xl font-black tracking-tighter text-slate-900 border-y-4 border-slate-900 py-4 px-8 transform -rotate-2">
						{gameResult.split(" (")[0].toUpperCase()}
					</div>
					<div className="text-sm text-muted-foreground font-medium">
						{gameResult.split(" (")[1]?.replace(")", "")}
					</div>
					<button
						className="inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 px-8 bg-slate-900 text-slate-50 hover:bg-slate-900/90 hover:-translate-y-0.5 active:translate-y-0"
						onClick={nextRound}
					>
						Play Next Round
					</button>
				</div>
			) : (
				<div className="space-y-8">
					<div className="grid grid-cols-3 gap-4">
						{hands.map((h) => (
							<button
								key={h.id}
								className={`group flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
									hand === h.id
										? "bg-slate-900 border-slate-900 text-slate-50 scale-[1.02]"
										: "bg-background border-slate-100 hover:border-slate-300 hover:bg-slate-50"
								} ${committed && hand !== h.id ? "opacity-20 saturate-0" : "opacity-100"}`}
								onClick={() => !committed && setHand(h.id)}
								disabled={committed}
							>
								<span className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-200">
									{h.icon}
								</span>
								<span className="font-bold text-xs uppercase tracking-[0.2em]">
									{h.name}
								</span>
							</button>
						))}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<button
							className={`h-12 rounded-md font-bold transition-all ${
								committed || hand === null
									? "bg-slate-50 text-slate-400 cursor-not-allowed border"
									: "bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50"
							}`}
							onClick={sendHandVal}
							disabled={committed || hand === null}
						>
							{committed ? "LOCKED IN" : "COMMIT MOVE"}
						</button>
						<button
							className={`h-12 rounded-md font-bold transition-all ${
								!committed || revealed || !opponentReady
									? "bg-slate-50 text-slate-400 cursor-not-allowed border"
									: "bg-slate-900 text-slate-50 hover:bg-slate-800"
							}`}
							onClick={proveHand}
							disabled={!committed || revealed || !opponentReady}
						>
							{revealed ? "COMPUTED" : "REVEAL & PROVE"}
						</button>
					</div>

					{committed && !revealed && !opponentReady && (
						<div className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-500 font-bold rounded-md border border-dashed text-xs animate-pulse">
							<span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
							Waiting for opponent commitment...
						</div>
					)}
				</div>
			)}
		</div>
	);
};
