"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { signIn } from "~/lib/auth-client";

export default function SignIn() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		await signIn.email(
			{
				email,
				password,
			},
			{
				onSuccess: () => {
					router.push("/home");
				},
				onError: ctx => {
					alert(ctx.error.message);
					setLoading(false);
				},
			}
		);
	};

	return (
		<div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
			{/* Left Side - Visual */}
			<div className="relative hidden h-full bg-muted lg:block">
				<Image
					src="/auth-cover.png"
					alt="Authentication Cover"
					fill
					className="object-cover brightness-[0.4]"
					priority
				/>
				<div className="absolute inset-0 flex flex-col justify-between p-12 text-white/90">
					<div className="flex items-center gap-2">
						<Image src="/manti.png" alt="Manti Logo" width={32} height={32} />
						<span className="font-bold text-xl tracking-tight">manti</span>
					</div>
					<div className="space-y-2">
						<blockquote className="space-y-2">
							<p className="font-medium text-lg leading-relaxed">
								&ldquo;The most intuitive way to manage your PostgreSQL
								databases. Visualize, query, and optimize with ease.&rdquo;
							</p>
						</blockquote>
					</div>
				</div>
			</div>

			{/* Right Side - Form */}
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-6">
					<div className="grid gap-2 text-center">
						<h1 className="font-bold text-3xl">Welcome back</h1>
						<p className="text-balance text-muted-foreground">
							Enter your email below to login to your account
						</p>
					</div>

					<form onSubmit={handleSignIn} className="grid gap-4">
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="m@example.com"
								value={email}
								onChange={e => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="grid gap-2">
							<div className="flex items-center">
								<Label htmlFor="password">Password</Label>
								<Link
									href="/forgot-password"
									className="ml-auto inline-block text-sm underline"
								>
									Forgot your password?
								</Link>
							</div>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={e => setPassword(e.target.value)}
								required
							/>
						</div>
						<Button type="submit" className="w-full" disabled={loading}>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Login
						</Button>
					</form>

					<div className="mt-4 text-center text-sm">
						Don&apos;t have an account?{" "}
						<Link href="/sign-up" className="underline">
							Sign up
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
