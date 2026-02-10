import type { PeerState } from "../lib/store";
import { QRSignaling } from "./qr-signaling";

interface LobbyProps {
	targetPeerId: string;
	setTargetPeerId: (val: string) => void;
	createOffer: () => void;
	signalingStatus: string;
	signalData: string;
	setSignalData: (val: string) => void;
	acceptSignal: () => void;
	peers: Record<string, PeerState>;
}

export const Lobby = ({
	targetPeerId,
	setTargetPeerId,
	createOffer,
	signalingStatus,
	signalData,
	setSignalData,
	acceptSignal,
	peers,
}: LobbyProps) => {
	return (
		<div className="p-6 bg-card border rounded-lg space-y-6">
			<div>
				<h3 className="text-lg font-semibold leading-none tracking-tight">
					Lobby
				</h3>
				<p className="text-sm text-muted-foreground mt-1.5">
					Manage your P2P connections.
				</p>
			</div>

			<div className="space-y-4">
				<div className="space-y-2 text-sm font-medium">
					<label htmlFor="target-peer">Remote Peer</label>
					<div className="flex gap-2">
						<input
							id="target-peer"
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Target Peer ID"
							value={targetPeerId}
							onChange={(e) => setTargetPeerId(e.target.value)}
						/>
						<button
							className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
							onClick={createOffer}
						>
							Connect
						</button>
					</div>
				</div>

				{signalingStatus && (
					<div className="text-xs p-3 rounded-md bg-accent text-accent-foreground border border-border italic">
						{signalingStatus}
					</div>
				)}

				<div className="space-y-2">
					<textarea
						className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono resize-none"
						placeholder="Paste Signal Data"
						value={signalData}
						onChange={(e) => setSignalData(e.target.value)}
					/>
					<div className="flex flex-wrap gap-2">
						<button
							className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-9 px-3 bg-slate-900 text-white hover:bg-slate-800"
							onClick={acceptSignal}
						>
							Accept
						</button>
						<button
							className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent h-9 px-3"
							onClick={() => navigator.clipboard.writeText(signalData)}
						>
							Copy
						</button>
						<button
							className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent h-9 px-3"
							onClick={async () => {
								try {
									const text = await navigator.clipboard.readText();
									setSignalData(text);
								} catch (err) {
									console.error("Failed to read clipboard:", err);
								}
							}}
						>
							Paste
						</button>
						<button
							className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 text-red-500 hover:bg-red-50"
							onClick={() => setSignalData("")}
						>
							Clear
						</button>
					</div>
				</div>

				<QRSignaling signalData={signalData} onScan={setSignalData} />
			</div>

			<div className="pt-4 border-t border-border">
				<h4 className="text-sm font-medium mb-3">
					Peers ({Object.keys(peers).length})
				</h4>
				<div className="space-y-2">
					{Object.entries(peers).map(([id, p]) => (
						<div
							key={id}
							className="flex items-center justify-between p-3 border rounded-md bg-background text-sm"
						>
							<div className="flex flex-col">
								<span className="font-mono font-bold">{id.slice(0, 8)}</span>
								<span className="text-xs text-muted-foreground italic">
									{p.description}
								</span>
							</div>
							<div className="flex gap-2">
								<span
									className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.committed ? "bg-slate-100" : "bg-slate-50 border border-dashed text-muted-foreground"}`}
								>
									{p.committed ? "LOCKED" : "THINKING"}
								</span>
								{p.verified && (
									<span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded text-[10px] font-bold">
										REVEALED
									</span>
								)}
							</div>
						</div>
					))}
					{Object.keys(peers).length === 0 && (
						<div className="text-center py-4 text-xs text-muted-foreground italic bg-slate-50 rounded-md border border-dashed">
							Waiting for connections...
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
