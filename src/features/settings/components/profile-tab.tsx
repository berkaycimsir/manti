"use client";

import ToggleThemeButton from "@shared/components/common/theme-toggle";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Separator } from "@shared/components/ui/separator";
import { Loader2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useLogout, useProfileMutations } from "../hooks/use-settings";

interface ProfileTabProps {
	session: { user?: { email?: string; name?: string } | null } | null;
}

export function ProfileTab({ session }: ProfileTabProps) {
	const [name, setName] = useState(session?.user?.name || "");
	const { isUpdatingProfile, handleUpdateProfile } = useProfileMutations();
	const { handleLogout } = useLogout();

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
		<div className="space-y-8">
			<div className="space-y-4">
				<div>
					<h3 className="font-medium text-lg">General Information</h3>
					<p className="text-muted-foreground text-sm">
						Update your profile details.
					</p>
				</div>
				<Separator />
				<form onSubmit={onSubmit} className="max-w-xl space-y-4">
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
					<div className="flex justify-start">
						<Button type="submit" disabled={isUpdatingProfile}>
							{isUpdatingProfile && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Save Changes
						</Button>
					</div>
				</form>
			</div>

			<div className="space-y-4">
				<div>
					<h3 className="font-medium text-lg">Appearance</h3>
					<p className="text-muted-foreground text-sm">
						Customize the interface theme.
					</p>
				</div>
				<Separator />
				<div className="flex max-w-xl items-center justify-between">
					<div className="space-y-1">
						<p className="font-medium">Theme</p>
						<p className="text-muted-foreground text-sm">
							Switch between light and dark mode.
						</p>
					</div>
					<ToggleThemeButton />
				</div>
			</div>

			<div className="space-y-4">
				<div>
					<h3 className="font-medium text-lg">Account</h3>
					<p className="text-muted-foreground text-sm">
						Manage your session and log out of the application.
					</p>
				</div>
				<Separator />
				<div className="max-w-xl">
					<Button
						variant="destructive"
						className="w-full lg:w-auto"
						onClick={handleLogout}
					>
						<LogOut className="mr-2 h-4 w-4" />
						Log out
					</Button>
				</div>
			</div>
		</div>
	);
}
