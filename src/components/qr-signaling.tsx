import { Html5Qrcode } from "html5-qrcode";
import { Camera, Loader2, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

interface QRSignalingProps {
	signalData: string;
	onScan: (data: string) => void;
}

export const QRSignaling = ({ signalData, onScan }: QRSignalingProps) => {
	const [showQR, setShowQR] = useState(false);
	const [showScanner, setShowScanner] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const scannerRef = useRef<Html5Qrcode | null>(null);

	useEffect(() => {
		if (showScanner) {
			const startScanner = async () => {
				setIsInitializing(true);
				setError(null);
				try {
					const scanner = new Html5Qrcode("reader");
					scannerRef.current = scanner;

					await scanner.start(
						{ facingMode: "environment" },
						{
							fps: 10,
							qrbox: { width: 250, height: 250 },
						},
						(decodedText) => {
							onScan(decodedText);
							setShowScanner(false);
						},
						() => {
							// Normal scanning
						},
					);
					setIsInitializing(false);
				} catch (err) {
					console.error("Failed to start scanner:", err);
					setError("Failed to start camera. Please check permissions.");
					setIsInitializing(false);
				}
			};

			startScanner();

			return () => {
				if (scannerRef.current) {
					scannerRef.current
						.stop()
						.then(() => {
							scannerRef.current = null;
						})
						.catch((err) => {
							console.error("Failed to stop scanner", err);
						});
				}
			};
		}
	}, [showScanner, onScan]);

	return (
		<div className="space-y-4 pt-4 border-t border-border">
			<div className="flex gap-2">
				<button
					className="inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent h-9 px-3 flex-1"
					onClick={() => {
						setShowQR(!showQR);
						setShowScanner(false);
					}}
				>
					<QrCode size={16} />
					{showQR ? "Hide QR" : "Show QR"}
				</button>
				<button
					className="inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent h-9 px-3 flex-1"
					onClick={() => {
						setShowScanner(!showScanner);
						setShowQR(false);
					}}
				>
					<Camera size={16} />
					{showScanner ? "Close Scanner" : "Scan QR"}
				</button>
			</div>

			{showQR && signalData && (
				<div className="flex flex-col items-center p-4 bg-white border rounded-lg animate-in fade-in zoom-in duration-200">
					<div className="p-2 bg-white rounded-lg border">
						<QRCodeSVG value={signalData} size={200} />
					</div>
					<span className="text-[10px] text-slate-500 mt-2 font-medium break-all max-w-full text-center">
						Share this QR code with your opponent
					</span>
				</div>
			)}

			{showQR && !signalData && (
				<div className="p-4 border border-dashed rounded-lg text-center text-xs text-slate-500 bg-slate-50">
					No signal data to show. Generate offer/answer first.
				</div>
			)}

			{showScanner && (
				<div className="relative p-0 bg-slate-900 border rounded-lg overflow-hidden animate-in fade-in zoom-in duration-200 min-h-75 flex flex-col items-center justify-center">
					<div id="reader" className="w-full" />

					{isInitializing && (
						<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white z-20 space-y-3">
							<Loader2 className="animate-spin" size={32} />
							<p className="text-sm font-medium">Starting Camera...</p>
							<p className="text-xs text-slate-400">
								Please allow camera access
							</p>
						</div>
					)}

					{error && (
						<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white z-20 p-6 text-center space-y-4">
							<p className="text-sm font-medium text-red-400">{error}</p>
							<button
								className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium transition-colors"
								onClick={() => setShowScanner(false)}
							>
								Close
							</button>
						</div>
					)}

					<button
						className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 z-30 transition-colors shadow-lg"
						onClick={() => setShowScanner(false)}
					>
						<X size={20} />
					</button>

					{!isInitializing && !error && (
						<div className="absolute bottom-4 left-0 right-0 text-center z-10">
							<p className="text-[10px] text-white/70 bg-black/40 py-1 px-3 rounded-full inline-block">
								Center the QR code within the frame
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
