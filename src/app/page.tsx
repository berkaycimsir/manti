import { ArrowRight, Database } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import ToggleThemeButton from "~/components/toggle-theme-button";
import { Button } from "~/components/ui/button";
import { stackServerApp } from "~/stack/server";

const features = [
	{
		title: "Query Builder",
		description:
			"Write and execute SQL queries with syntax highlighting and auto-completion",
	},
	{
		title: "Data Visualization",
		description: "View and explore your data with intuitive tables and charts",
	},
	{
		title: "Schema Management",
		description: "Create, modify, and manage database schemas with ease",
	},
];

export default async function LandingPage() {
	if (await stackServerApp.getUser()) redirect("/home");

	return (
		<main className="min-h-screen bg-background text-foreground">
			{/* Navigation */}
			<nav className="border-border border-b">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-2">
						<Image
							src="/manti.png"
							alt="manti PostgreSQL interface"
							width={36}
							height={36}
						/>
						<span className="font-bold text-xl">manti</span>
					</div>
					<div className="flex items-center gap-3">
						<Button asChild size="sm">
							<Link href="/handler/signin">Sign In</Link>
						</Button>
						<ToggleThemeButton />
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32 lg:px-8">
				<div className="grid items-center gap-12 md:grid-cols-2">
					<div className="space-y-6">
						<h1 className="text-balance font-bold text-4xl leading-tight md:text-5xl lg:text-6xl">
							PostgreSQL management, simplified
						</h1>
						<p className="max-w-lg text-lg text-muted-foreground leading-relaxed">
							A modern, intuitive interface for managing your PostgreSQL
							databases. Query, visualize, and manage your data with ease.
						</p>
						<div className="flex flex-col gap-3 pt-4 sm:flex-row">
							<Button asChild size="lg" className="gap-2">
								<div>
									<Link href="/handler/signup">Get Started</Link>
									<ArrowRight className="h-4 w-4" />
								</div>
							</Button>
						</div>
					</div>

					<div className="relative hidden justify-self-end md:block">
						<Image
							src="/pg.png"
							alt="manti PostgreSQL interface"
							width={420}
							height={420}
						/>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="border-border border-t bg-card/50">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="mb-4 font-bold text-3xl md:text-4xl">
							Powerful features
						</h2>
						<p className="mx-auto max-w-2xl text-muted-foreground">
							Everything you need to manage your PostgreSQL databases
							efficiently
						</p>
					</div>

					<div className="grid gap-8 md:grid-cols-3">
						{features.map((feature, _i) => (
							<div
								key={feature.title}
								className="rounded-lg border border-border bg-background p-6 transition-colors hover:bg-card/50"
							>
								<h3 className="mb-2 font-semibold text-lg">{feature.title}</h3>
								<p className="text-muted-foreground text-sm">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="border-border border-t">
				<div className="mx-auto max-w-4xl space-y-6 px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8">
					<h2 className="font-bold text-3xl md:text-4xl">
						Ready to get started?
					</h2>
					<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
						Join developers who are simplifying their database management
						workflow
					</p>
					<div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
						<Button size="lg" className="gap-2">
							Sign up now <ArrowRight className="h-4 w-4" />
						</Button>
						<Button size="lg" variant="outline">
							Learn more
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-border border-t bg-card/50">
				<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<div className="flex items-center gap-2">
							<Database className="h-5 w-5 text-primary" />
							<span className="font-semibold">manti</span>
						</div>
						<p className="text-muted-foreground text-sm">
							© 2025 manti. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</main>
	);
}
