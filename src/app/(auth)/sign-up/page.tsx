"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { signUp } from "~/lib/auth-client";

export default function SignUp() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		await signUp.email(
			{
				email,
				password,
				name,
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
								&ldquo;Join thousands of developers managing their data with
								precision and speed.&rdquo;
							</p>
						</blockquote>
					</div>
				</div>
			</div>

			{/* Right Side - Form */}
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-6">
					<div className="grid gap-2 text-center">
						<h1 className="font-bold text-3xl">Create an account</h1>
						<p className="text-balance text-muted-foreground">
							Enter your email below to create your account
						</p>
					</div>

					<form onSubmit={handleSignUp} className="grid gap-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								placeholder="John Doe"
								value={name}
								onChange={e => setName(e.target.value)}
								required
							/>
						</div>
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
							<Label htmlFor="password">Password</Label>
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
							Create Account
						</Button>
					</form>
					<div className="mt-4 text-center text-sm">
						Already have an account?{" "}
						<Link href="/sign-in" className="underline">
							Sign in
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
