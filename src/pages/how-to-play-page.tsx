import { Cpu, Info, Link as LinkIcon, Zap } from "lucide-react";

export const HowToPlayPage = () => {
	return (
		<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
			<div className="p-8 space-y-16">
				{/* Section 1: Concept */}
				<section className="space-y-6">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-slate-100 text-slate-600 flex items-center justify-center rounded-xl transition-colors">
							<Info size={24} />
						</div>
						<h3 className="text-2xl font-black tracking-tight text-slate-900">
							コンセプト
						</h3>
					</div>
					<div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200">
						<p className="text-slate-600 leading-relaxed font-medium">
							このアプリは、中央サーバーを一切介さず、ユーザー同士が直接つながって遊ぶ
							<span className="text-slate-900 font-bold underline decoration-slate-200 underline-offset-4 mx-1">
								完全P2P・サーバーレス
							</span>
							のジャンケンゲームです。
							ゼロ知識証明（ZK）技術により、相手に手を知られることなく、かつ不正が不可能な対戦を実現しています。
						</p>
					</div>
				</section>

				{/* Section 2: P2P Connection */}
				<section className="space-y-8">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-slate-100 text-slate-600 flex items-center justify-center rounded-xl">
							<LinkIcon size={24} />
						</div>
						<h3 className="text-2xl font-black tracking-tight text-slate-900">
							接続の手順
						</h3>
					</div>

					<div className="space-y-4">
						<div className="space-y-8">
							<div className="">
								<div className="space-y-2">
									<h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">
										1. Offer側の操作 (接続を開始する人)
									</h4>
									<p className="text-slate-500 font-medium text-sm leading-relaxed">
										<strong>Connect</strong>{" "}
										を押して「Offerシグナル」を発行し、相手に送ります。
									</p>
								</div>
							</div>

							<div className="">
								<div className="space-y-2">
									<h4 className="font-black text-slate-500 uppercase tracking-widest text-xs">
										2. Answer側の操作 (受け取る人)
									</h4>
									<p className="text-slate-500 font-medium text-sm leading-relaxed">
										届いたシグナルを貼り付けて <strong>Accept</strong>{" "}
										を押します。生成された「Answerシグナル」をOffer側に送り返します。
									</p>
								</div>
							</div>

							<div className="">
								<div className="space-y-3 p-5 bg-slate-50 rounded-xl border border-slate-200">
									<h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">
										3. Offer側の最終操作 (完了)
									</h4>
									<p className="text-slate-600 font-bold leading-relaxed text-sm">
										Offer側は、最初に入力していたデータを一度{" "}
										<span className="underline decoration-slate-300">
											Clear
										</span>{" "}
										で消去してから、相手からのAnswerを貼り付けて再度{" "}
										<strong>Accept</strong> を押してください。
									</p>
									<p className="text-[10px] text-slate-400 font-medium">
										これで相互の接続が確立されます。
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Section 3: Game Flow */}
				<section className="space-y-8">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-slate-100 text-slate-600 flex items-center justify-center rounded-xl">
							<Zap size={24} />
						</div>
						<h3 className="text-2xl font-black tracking-tight text-slate-900">
							対戦の仕組み
						</h3>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="p-6 border-2 border-slate-900 rounded-2xl space-y-4 bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-all">
							<div className="flex items-center gap-2">
								<Cpu size={14} className="text-slate-400" />
								<h4 className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded uppercase tracking-widest">
									Phase 1: Commit
								</h4>
							</div>
							<p className="text-sm text-slate-500 font-medium leading-relaxed">
								手を選んで「Commit」します。選択は暗号化され、相手には「何かを出した」ということだけが伝わります。
							</p>
						</div>

						<div className="p-6 border-2 border-slate-900 rounded-2xl space-y-4 bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-all">
							<div className="flex items-center gap-2">
								<Zap size={14} className="text-slate-400" />
								<h4 className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded uppercase tracking-widest">
									Phase 2: Reveal
								</h4>
							</div>
							<p className="text-sm text-slate-500 font-medium leading-relaxed">
								全員が揃ったら公開！zk-SNARKsにより、あなたが「最初にCommitした手から変更していないこと」が完璧に証明されます。
							</p>
						</div>
					</div>
				</section>

				<div className="pt-20 pb-4 text-center">
					<div className="font-black text-[10px] text-slate-200 tracking-[0.4em] uppercase">
						Powered by WebRTC & Groth16 Snarks
					</div>
				</div>
			</div>
		</div>
	);
};
