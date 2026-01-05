"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import ToggleThemeButton from "~/components/toggle-theme-button";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useProfileMutations } from "~/hooks/use-settings";

interface ProfileTabProps {
	session: { user?: { email?: string; name?: string } | null } | null;
}

export function ProfileTab({ session }: ProfileTabProps) {
	const [name, setName] = useState(session?.user?.name || "");
	const { isUpdatingProfile, handleUpdateProfile } = useProfileMutations();

	// Sync name with session when it changes
	useEffect(() => {
		if (session?.user?.name) {
			setName(session.user.name);
		}
	}, [session?.user?.name]);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		await handleUpdateProfile(name);
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>General Information</CardTitle>
					<CardDescription>Update your profile details.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="space-y-4">
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								value={session?.user?.email || ""}
								disabled
								className="bg-muted"
							/>
							<p className="text-[0.8rem] text-muted-foreground">
								Email cannot be changed directly.
							</p>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								value={name}
								onChange={e => setName(e.target.value)}
								placeholder="Your Name"
							/>
						</div>
						<div className="flex justify-end">
							<Button type="submit" disabled={isUpdatingProfile}>
								{isUpdatingProfile && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Save Changes
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Appearance</CardTitle>
					<CardDescription>Customize the interface theme.</CardDescription>
				</CardHeader>
				<CardContent className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="font-medium">Theme</p>
						<p className="text-muted-foreground text-sm">
							Switch between light and dark mode.
						</p>
					</div>
					<ToggleThemeButton />
				</CardContent>
			</Card>
		</div>
	);
}
