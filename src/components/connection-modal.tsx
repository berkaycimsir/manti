"use client";

import type React from "react";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface ConnectionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConnect: (connection: any) => void;
}

export default function ConnectionModal({
	isOpen,
	onClose,
	onConnect,
}: ConnectionModalProps) {
	const [activeTab, setActiveTab] = useState("manual");
	const [formData, setFormData] = useState({
		name: "",
		host: "localhost",
		port: 5432,
		database: "",
		username: "",
		password: "",
		connectionString: "",
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (activeTab === "manual") {
			onConnect({
				name: formData.name,
				connectionType: "manual",
				host: formData.host,
				port: formData.port,
				database: formData.database,
				username: formData.username,
				password: formData.password,
				ssl: false,
			});
		} else {
			onConnect({
				name: formData.name,
				connectionType: "connection_string",
				connectionString: formData.connectionString,
			});
		}

		setFormData({
			name: "",
			host: "localhost",
			port: 5432,
			database: "",
			username: "",
			password: "",
			connectionString: "",
		});
		setActiveTab("manual");
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<Card className="w-full max-w-md p-6">
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-foreground text-xl">New Connection</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded p-1 transition-colors hover:bg-muted"
					>
						<X className="h-5 w-5 text-muted-foreground" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="conn-name"
							className="mb-1 block font-medium text-foreground text-sm"
						>
							Connection Name
						</label>
						<Input
							id="conn-name"
							placeholder="My Database"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
						/>
					</div>

					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="manual">Manual</TabsTrigger>
							<TabsTrigger value="connection-string">
								Connection String
							</TabsTrigger>
						</TabsList>

						<TabsContent value="manual" className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="host"
										className="mb-1 block font-medium text-foreground text-sm"
									>
										Host
									</label>
									<Input
										id="host"
										placeholder="localhost"
										value={formData.host}
										onChange={(e) =>
											setFormData({ ...formData, host: e.target.value })
										}
										required
									/>
								</div>
								<div>
									<label
										htmlFor="port"
										className="mb-1 block font-medium text-foreground text-sm"
									>
										Port
									</label>
									<Input
										id="port"
										type="number"
										placeholder="5432"
										value={formData.port}
										onChange={(e) =>
											setFormData({
												...formData,
												port: Number.parseInt(e.target.value),
											})
										}
										required
									/>
								</div>
							</div>

							<div>
								<label
									htmlFor="database"
									className="mb-1 block font-medium text-foreground text-sm"
								>
									Database
								</label>
								<Input
									id="database"
									placeholder="postgres"
									value={formData.database}
									onChange={(e) =>
										setFormData({ ...formData, database: e.target.value })
									}
									required
								/>
							</div>

							<div>
								<label
									htmlFor="username"
									className="mb-1 block font-medium text-foreground text-sm"
								>
									Username
								</label>
								<Input
									id="username"
									placeholder="postgres"
									value={formData.username}
									onChange={(e) =>
										setFormData({ ...formData, username: e.target.value })
									}
									required
								/>
							</div>

							<div>
								<label
									htmlFor="password"
									className="mb-1 block font-medium text-foreground text-sm"
								>
									Password
								</label>
								<Input
									id="password"
									type="password"
									placeholder="••••••••"
									value={formData.password}
									onChange={(e) =>
										setFormData({ ...formData, password: e.target.value })
									}
									required
								/>
							</div>
						</TabsContent>

						<TabsContent value="connection-string" className="space-y-4">
							<div>
								<label
									htmlFor="conn-string"
									className="mb-1 block font-medium text-foreground text-sm"
								>
									Connection String
								</label>
								<Input
									id="conn-string"
									type="password"
									placeholder="postgresql://user:password@localhost:5432/database"
									value={formData.connectionString}
									onChange={(e) =>
										setFormData({
											...formData,
											connectionString: e.target.value,
										})
									}
									required
								/>
							</div>
							<p className="text-muted-foreground text-xs">
								Enter your PostgreSQL connection string. Example:
								postgresql://user:password@host:5432/database
							</p>
						</TabsContent>
					</Tabs>

					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							className="flex-1 bg-transparent"
						>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							Connect
						</Button>
					</div>
				</form>
			</Card>
		</div>
	);
}
