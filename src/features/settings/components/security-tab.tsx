"use client";

import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Separator } from "@shared/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@shared/components/ui/table";
import { Laptop, Loader2 } from "lucide-react";
import { useState } from "react";
import { usePasswordChange, useSessionManagement } from "../hooks/use-settings";

interface SecurityTabProps {
	currentSessionToken?: string;
}

export function SecurityTab({ currentSessionToken }: SecurityTabProps) {
	// Password form state
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	// Hooks
	const { isChangingPassword, handleChangePassword } = usePasswordChange();
	const {
		sessions,
		isLoadingSessions,
		revokeSession,
		revokeAllOther,
		isRevokingSession,
		isRevokingAll,
	} = useSessionManagement();

	const onSubmitPassword = async (e: React.FormEvent) => {
		e.preventDefault();

		if (newPassword !== confirmPassword) {
			alert("New passwords do not match.");
			return;
		}
		if (newPassword.length < 8) {
			alert("Password must be at least 8 characters.");
			return;
		}

		const result = await handleChangePassword(currentPassword, newPassword);
		if (result.success) {
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		}
	};

	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<div>
					<h3 className="font-medium text-lg">Change Password</h3>
					<p className="text-muted-foreground text-sm">
						Update your password to keep your account secure.
					</p>
				</div>
				<Separator />
				<form onSubmit={onSubmitPassword} className="max-w-xl space-y-4">
					<div className="grid gap-2">
						<Label htmlFor="current-password">Current Password</Label>
						<Input
							id="current-password"
							type="password"
							value={currentPassword}
							onChange={e => setCurrentPassword(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="new-password">New Password</Label>
						<Input
							id="new-password"
							type="password"
							value={newPassword}
							onChange={e => setNewPassword(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="confirm-password">Confirm New Password</Label>
						<Input
							id="confirm-password"
							type="password"
							value={confirmPassword}
							onChange={e => setConfirmPassword(e.target.value)}
							required
						/>
					</div>
					<div className="flex justify-end">
						<Button type="submit" disabled={isChangingPassword}>
							{isChangingPassword && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Update Password
						</Button>
					</div>
				</form>
			</div>

			<div className="space-y-4">
				<div>
					<h3 className="font-medium text-lg">Active Sessions</h3>
					<p className="text-muted-foreground text-sm">
						Manage devices where you are currently logged in.
					</p>
				</div>
				<Separator />
				<div className="space-y-4">
					<div className="flex justify-end">
						<Button
							variant="outline"
							size="sm"
							onClick={revokeAllOther}
							disabled={isRevokingAll}
						>
							{isRevokingAll && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Revoke All Others
						</Button>
					</div>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Device</TableHead>
									<TableHead>IP Address</TableHead>
									<TableHead>Expires</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoadingSessions ? (
									<TableRow>
										<TableCell colSpan={4} className="h-24 text-center">
											<Loader2 className="mx-auto h-6 w-6 animate-spin" />
										</TableCell>
									</TableRow>
								) : (
									sessions?.map(s => {
										const isCurrent = s.token === currentSessionToken;
										return (
											<TableRow key={s.id}>
												<TableCell>
													<div className="flex items-center gap-2">
														<Laptop className="h-4 w-4 text-muted-foreground" />
														<span
															className="max-w-[150px] truncate"
															title={s.userAgent || "Unknown"}
														>
															{s.userAgent
																? /Chrome|Firefox|Safari|Edge/.exec(
																		s.userAgent
																	)?.[0] || "Browser"
																: "Unknown Device"}
														</span>
														{isCurrent && (
															<Badge variant="secondary" className="ml-2">
																Current
															</Badge>
														)}
													</div>
												</TableCell>
												<TableCell>{s.ipAddress || "Unknown"}</TableCell>
												<TableCell>
													{new Date(s.expiresAt).toLocaleDateString()}
												</TableCell>
												<TableCell className="text-right">
													{!isCurrent && (
														<Button
															variant="ghost"
															size="sm"
															className="text-destructive hover:bg-destructive/10"
															onClick={() => revokeSession(s.id)}
															disabled={isRevokingSession}
														>
															Revoke
														</Button>
													)}
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>
		</div>
	);
}
