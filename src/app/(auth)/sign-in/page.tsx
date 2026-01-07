"use client";

import { SignInForm } from "@features/auth";
import Image from "next/image";

export default function SignIn() {
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
				<SignInForm />
			</div>
		</div>
	);
}
