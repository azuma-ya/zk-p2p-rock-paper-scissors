interface IdentityCardProps {
	myId: string;
}

export const IdentityCard = ({ myId }: IdentityCardProps) => {
	return (
		<div className="p-4 bg-background border rounded-lg">
			<div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
				My Instance ID
			</div>
			<div className="mt-1 font-mono text-sm font-bold tracking-tight text-foreground truncate">
				{myId}
			</div>
		</div>
	);
};
