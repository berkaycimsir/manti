"use client";

import { ScrollArea } from "@shared/components/ui/scroll-area";
import { TooltipProvider } from "@shared/components/ui/tooltip";
import { useLocalStorageExplorer } from "@shared/hooks/use-local-storage-explorer";
import {
	AlertCircle,
	Archive,
	Database,
	Settings as SettingsIcon,
} from "lucide-react";
import { useLocalStorageReset } from "../../hooks/use-local-storage-reset";
import { StorageItemTag } from "./storage-item-tag";

export function LocalDataExplorer() {
	const { dbMap, connections, refreshData } = useLocalStorageExplorer();
	const { handleReset } = useLocalStorageReset(connections, refreshData);

	if (!dbMap)
		return (
			<div className="p-8 text-center text-muted-foreground">
				Scanning storage...
			</div>
		);

	const sortedDbs = Object.values(dbMap).sort((a, b) => {
		if (a.name === "Application Settings") return -1;
		if (b.name === "Application Settings") return 1;
		return a.name.localeCompare(b.name);
	});

	const isEmpty = sortedDbs.every(
		d => d.generic.length === 0 && Object.keys(d.tables).length === 0
	);

	return (
		<TooltipProvider>
			<ScrollArea className="h-full bg-muted/10">
				{isEmpty && (
					<div className="flex h-[400px] flex-col items-center justify-center gap-4 text-muted-foreground">
						<AlertCircle className="h-12 w-12 opacity-20" />
						<p>No customized local settings found.</p>
					</div>
				)}
				<div className="flex flex-col gap-4 p-6">
					{sortedDbs.map(db => {
						const hasGeneric = db.generic.length > 0;
						const hasTables = Object.keys(db.tables).length > 0;
						if (!hasGeneric && !hasTables) return null;

						return (
							<div
								key={db.name}
								className="overflow-hidden rounded-xl border bg-card shadow-sm"
							>
								<div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
										{db.name === "Application Settings" ? (
											<SettingsIcon className="h-4 w-4" />
										) : (
											<Database className="h-4 w-4" />
										)}
									</div>
									<h3 className="font-semibold text-sm">{db.name}</h3>
								</div>

								<div className="flex flex-col">
									{hasGeneric && (
										<div className="border-b p-4">
											<h4 className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
												{db.name === "Application Settings"
													? "Preferences"
													: "History & Shortcuts"}
											</h4>
											<div className="flex flex-wrap gap-2">
												{db.generic.map(item => (
													<StorageItemTag
														key={item.key}
														item={item}
														dbName={db.name}
														tableKey={null}
														onReset={() => handleReset(db.name, null, item)}
													/>
												))}
											</div>
										</div>
									)}

									{hasTables && (
										<div className="divide-y">
											{Object.entries(db.tables).map(([tableKey, items]) => (
												<div
													key={tableKey}
													className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/5 sm:flex-row sm:items-center sm:justify-between"
												>
													<div className="flex items-center gap-3">
														<div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
															<Archive className="h-4 w-4" />
														</div>
														<div className="flex flex-col">
															<span className="font-medium text-sm">
																{tableKey}
															</span>
															<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
																Table Settings
															</span>
														</div>
													</div>
													<div className="flex flex-wrap items-center gap-2">
														{items.map(item => (
															<StorageItemTag
																key={item.key}
																item={item}
																dbName={db.name}
																tableKey={tableKey}
																onReset={() =>
																	handleReset(db.name, tableKey, item)
																}
															/>
														))}
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</ScrollArea>
		</TooltipProvider>
	);
}
