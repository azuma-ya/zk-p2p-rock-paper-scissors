import { Link, Outlet, useLocation } from "react-router-dom";

export const Layout = () => {
	const location = useLocation();
	const isHowToPlay = location.pathname === "/how-to-play";

	return (
		<div className="min-h-screen bg-slate-50/50 text-slate-950">
			<div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
				<header className="mb-16 space-y-4">
					<div className="flex flex-col items-center text-center">
						<div className="bg-slate-900 text-slate-50 text-[10px] font-black px-2 py-1 rounded mb-4 tracking-widest uppercase">
							P2P Protocol v0.1
						</div>
						<h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl text-slate-900">
							ZK Rock Paper Scissors
						</h1>
						<p className="max-w-[600px] text-slate-500 md:text-xl font-medium mt-4">
							A serverless, private RPS game powered by Zero-Knowledge Proofs
							and WebRTC.
						</p>
						<div className="mt-8">
							<Link
								to={isHowToPlay ? "/" : "/how-to-play"}
								className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 py-2 px-3 rounded-full bg-slate-100 hover:bg-slate-200"
							>
								<span className="text-sm">{isHowToPlay ? "🎮" : "📖"}</span>{" "}
								{isHowToPlay ? "Back to Game" : "How to Play"}
							</Link>
						</div>
					</div>
				</header>

				<main>
					<Outlet />
				</main>

				<footer className="mt-24 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-[10px] text-slate-400 font-black tracking-[0.3em] uppercase">
						Secured by Groth16 Snarks
					</p>
					<div className="flex gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
						<span>Peer-to-Peer</span>
						<span className="opacity-30">•</span>
						<span>No Server</span>
						<span className="opacity-30">•</span>
						<span>Private</span>
					</div>
				</footer>
			</div>
		</div>
	);
};
