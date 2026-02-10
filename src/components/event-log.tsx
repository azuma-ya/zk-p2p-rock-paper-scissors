import type { GameMessage } from "../lib/types";

interface EventLogProps {
	logs: GameMessage[];
}

export const EventLog = ({ logs }: EventLogProps) => {
	return (
		<div className="bg-card border rounded-lg flex flex-col h-100 overflow-hidden">
			<div className="p-4 border-b">
				<h3 className="text-sm font-semibold tracking-tight uppercase flex items-center gap-2">
					<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
					Security Log
				</h3>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[10px] leading-relaxed">
				{logs.length === 0 && (
					<div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
						<div className="text-2xl">⚡</div>
						<div className="italic">Monitoring P2P activity...</div>
					</div>
				)}
				{logs.map((L) => (
					<div
						key={`${L.senderId}-${L.timestamp}`}
						className="p-3 bg-slate-50/50 border rounded-sm space-y-2 border-slate-100"
					>
						<div className="flex justify-between items-center opacity-70">
							<span>{new Date(L.timestamp).toLocaleTimeString()}</span>
							<span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-xs font-black text-[8px]">
								{L.type}
							</span>
						</div>
						<div className="text-slate-800 break-all">
							<span className="font-black text-slate-900 p-0.5 bg-slate-200/50 rounded-xs mr-1">
								{L.senderId.slice(0, 8)}
							</span>
							{L.type === "HAND_COMMIT"
								? "Broadcasted cryptographic commitment."
								: L.type === "HAND_PROOF"
									? "Submitted Groth16 proof & revealed selection."
									: "Dispatched direct message."}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
