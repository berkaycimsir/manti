"use client";

import { type FormEvent, useState } from "react";
import { api } from "~/trpc/react";

interface ConnectionFormProps {
	onSuccess?: () => void;
}

export function AddConnectionForm({ onSuccess }: ConnectionFormProps) {
	const [connectionType, setConnectionType] = useState<
		"connection_string" | "manual"
	>("connection_string");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createConnection = api.database.createConnection.useMutation({
		onSuccess: () => {
			setError(null);
			onSuccess?.();
		},
		onError: (err) => {
			setError(err.message);
		},
	});

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);

		try {
			if (connectionType === "connection_string") {
				await createConnection.mutateAsync({
					connectionType: "connection_string",
					name: formData.get("name") as string,
					connectionString: formData.get("connectionString") as string,
				});
			} else {
				const sslMode = formData.get("sslMode") as
					| "disable"
					| "prefer"
					| "require"
					| "verify-full";
				await createConnection.mutateAsync({
					connectionType: "manual",
					name: formData.get("name") as string,
					host: formData.get("host") as string,
					port: Number(formData.get("port")),
					username: formData.get("username") as string,
					password: formData.get("password") as string,
					database: formData.get("database") as string,
					ssl: sslMode !== "disable",
					sslMode: sslMode,
				});
			}
			(e.target as HTMLFormElement).reset();
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 rounded border p-4">
			<h2 className="font-semibold text-lg">Add New Connection</h2>

			{error && (
				<div className="rounded bg-red-100 p-2 text-red-800">{error}</div>
			)}

			<div>
				<label htmlFor="name" className="block font-medium text-sm">
					Connection Name
				</label>
				<input
					id="name"
					type="text"
					name="name"
					required
					placeholder="My Database"
					className="w-full rounded border px-2 py-1"
				/>
			</div>

			<div>
				<label htmlFor="connectionType" className="block font-medium text-sm">
					Connection Type
				</label>
				<div className="flex gap-4">
					<label className="flex items-center">
						<input
							id="connectionType"
							type="radio"
							value="connection_string"
							checked={connectionType === "connection_string"}
							onChange={(e) =>
								setConnectionType(
									e.target.value as "connection_string" | "manual",
								)
							}
						/>
						<span className="ml-2">Connection String</span>
					</label>
					<label className="flex items-center">
						<input
							type="radio"
							value="manual"
							checked={connectionType === "manual"}
							onChange={(e) =>
								setConnectionType(
									e.target.value as "connection_string" | "manual",
								)
							}
						/>
						<span className="ml-2">Manual</span>
					</label>
				</div>
			</div>

			{connectionType === "connection_string" ? (
				<div>
					<label
						htmlFor="connectionString"
						className="block font-medium text-sm"
					>
						Connection String
					</label>
					<input
						id="connectionString"
						type="password"
						name="connectionString"
						required
						placeholder="postgresql://user:password@localhost:5432/database"
						className="w-full rounded border px-2 py-1"
					/>
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label htmlFor="host" className="block font-medium text-sm">
								Host
							</label>
							<input
								id="host"
								type="text"
								name="host"
								required
								placeholder="localhost"
								className="w-full rounded border px-2 py-1"
							/>
						</div>
						<div>
							<label htmlFor="port" className="block font-medium text-sm">
								Port
							</label>
							<input
								id="port"
								type="number"
								name="port"
								required
								placeholder="5432"
								className="w-full rounded border px-2 py-1"
							/>
						</div>
						<div>
							<label htmlFor="username" className="block font-medium text-sm">
								Username
							</label>
							<input
								id="username"
								type="text"
								name="username"
								required
								placeholder="postgres"
								className="w-full rounded border px-2 py-1"
							/>
						</div>
						<div>
							<label htmlFor="password" className="block font-medium text-sm">
								Password
							</label>
							<input
								id="password"
								type="password"
								name="password"
								placeholder="password"
								className="w-full rounded border px-2 py-1"
							/>
						</div>
						<div className="col-span-2">
							<label htmlFor="database" className="block font-medium text-sm">
								Database Name
							</label>
							<input
								id="database"
								type="text"
								name="database"
								required
								placeholder="mydb"
								className="w-full rounded border px-2 py-1"
							/>
						</div>
						<div className="col-span-2">
							<label htmlFor="sslMode" className="block font-medium text-sm">
								SSL Mode
							</label>
							<select
								id="sslMode"
								name="sslMode"
								defaultValue="disable"
								className="w-full rounded border px-2 py-1"
							>
								<option value="disable">Disable - No SSL</option>
								<option value="prefer">Prefer - Use SSL if available</option>
								<option value="require">Require - Always use SSL</option>
								<option value="verify-full">
									Verify Full - SSL with certificate verification
								</option>
							</select>
						</div>
					</div>
				</>
			)}

			<button
				type="submit"
				disabled={loading}
				className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-blue-300"
			>
				{loading ? "Connecting..." : "Add Connection"}
			</button>
		</form>
	);
}
