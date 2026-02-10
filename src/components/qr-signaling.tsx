import { Html5QrcodeScanner } from "html5-qrcode";
import { Camera, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

interface QRSignalingProps {
	signalData: string;
	onScan: (data: string) => void;
}

export const QRSignaling = ({ signalData, onScan }: QRSignalingProps) => {
	const [showQR, setShowQR] = useState(false);
	const [showScanner, setShowScanner] = useState(false);

	useEffect(() => {
		if (showScanner) {
			const scanner = new Html5QrcodeScanner(
				"reader",
				{ fps: 10, qrbox: { width: 250, height: 250 } },
				/* verbose= */ false,
			);

			scanner.render(
				(decodedText) => {
					onScan(decodedText);
					setShowScanner(false);
					scanner.clear();
				},
				(_error) => {
					// Silent error - it's normal during scanning
				},
			);

			return () => {
				scanner.clear().catch((error) => {
					console.error("Failed to clear scanner", error);
				});
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
					<div className="p-2 bg-white rounded-lg">
						<QRCodeSVG value={signalData} size={200} />
					</div>
					<span className="text-[10px] text-muted-foreground mt-2 break-all max-w-full text-center">
						Share this QR code with your opponent
					</span>
				</div>
			)}

			{showQR && !signalData && (
				<div className="p-4 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
					No signal data to show. Generate offer/answer first.
				</div>
			)}

			{showScanner && (
				<div className="relative p-0 bg-black border rounded-lg overflow-hidden animate-in fade-in zoom-in duration-200">
					<div id="reader" className="w-full" />
					<button
						className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 z-10"
						onClick={() => setShowScanner(false)}
					>
						<X size={20} />
					</button>
				</div>
			)}
		</div>
	);
};
