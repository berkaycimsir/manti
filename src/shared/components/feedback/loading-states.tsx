import { Skeleton } from "@shared/components/ui/skeleton";
import { cn } from "@shared/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	className?: string;
}

const sizeMap = {
	sm: "h-4 w-4",
	md: "h-6 w-6",
	lg: "h-8 w-8",
};

export function LoadingSpinner({
	size = "md",
	className,
}: LoadingSpinnerProps) {
	return (
		<Loader2
			className={cn(
				"animate-spin text-muted-foreground",
				sizeMap[size],
				className
			)}
		/>
	);
}

interface LoadingOverlayProps {
	message?: string;
}

export function LoadingOverlay({
	message = "Loading...",
}: LoadingOverlayProps) {
	return (
		<div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<div className="flex flex-col items-center gap-2">
				<LoadingSpinner size="lg" />
				<p className="text-muted-foreground text-sm">{message}</p>
			</div>
		</div>
	);
}

interface LoadingPageProps {
	message?: string;
}

export function LoadingPage({ message = "Loading..." }: LoadingPageProps) {
	return (
		<div className="flex h-full min-h-[400px] items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<LoadingSpinner size="lg" />
				<p className="text-muted-foreground text-sm">{message}</p>
			</div>
		</div>
	);
}

interface TableSkeletonProps {
	rows?: number;
	columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
	return (
		<div className="w-full space-y-3">
			{/* Header */}
			<div className="flex gap-4">
				{Array.from({ length: columns }).map((_, i) => (
					<Skeleton key={i} className="h-8 flex-1" />
				))}
			</div>
			{/* Rows */}
			{Array.from({ length: rows }).map((_, rowIdx) => (
				<div key={rowIdx} className="flex gap-4">
					{Array.from({ length: columns }).map((_, colIdx) => (
						<Skeleton key={colIdx} className="h-10 flex-1" />
					))}
				</div>
			))}
		</div>
	);
}

interface CardSkeletonProps {
	count?: number;
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="space-y-3 rounded-lg border p-4">
					<Skeleton className="h-5 w-2/3" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-1/2" />
				</div>
			))}
		</div>
	);
}
