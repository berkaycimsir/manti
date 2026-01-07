"use client";

import { Button } from "@shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@shared/components/ui/card";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
		this.props.onError?.(error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<Card className="mx-auto mt-8 max-w-md">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-destructive">
							<AlertCircle className="h-5 w-5" />
							Something went wrong
						</CardTitle>
						<CardDescription>
							An unexpected error occurred. Please try again.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<pre className="max-h-32 overflow-auto rounded-md bg-muted p-3 text-xs">
							{this.state.error?.message ?? "Unknown error"}
						</pre>
					</CardContent>
					<CardFooter>
						<Button onClick={this.handleReset} variant="outline" size="sm">
							<RefreshCcw className="mr-2 h-4 w-4" />
							Try Again
						</Button>
					</CardFooter>
				</Card>
			);
		}

		return this.props.children;
	}
}
