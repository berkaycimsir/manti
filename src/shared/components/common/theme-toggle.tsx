"use client";
import { Button } from "@shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@shared/components/ui/tooltip";
import { cn } from "@shared/lib/utils";
import { useThemeStore } from "@shared/stores/theme-store";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { THEME_COLORS } from "~/config/theme-config";

function ToggleThemeButton() {
	const { theme, setTheme } = useTheme();
	const { color, setColor, overrideColor } = useThemeStore();

	// Ensure component is mounted to avoid hydration mismatch on icon rendering
	const [_mounted, setMounted] = React.useState(false);
	React.useEffect(() => {
		setMounted(true);
	}, []);

	const colors = THEME_COLORS;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className={cn(
						"relative ring-1 ring-primary",
						overrideColor && "ring-offset-2 ring-offset-background"
					)}
				>
					<Sun className="dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0" />
					<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[340px]">
				<div className="p-2">
					<DropdownMenuLabel className="px-0.5 font-semibold text-muted-foreground text-xs uppercase">
						Mode
					</DropdownMenuLabel>
					<div className="grid grid-cols-3 gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setTheme("light")}
							className={cn(
								"justify-start gap-2",
								theme === "light" && "border-primary bg-accent"
							)}
						>
							<Sun className="h-4 w-4" />
							Light
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setTheme("dark")}
							className={cn(
								"justify-start gap-2",
								theme === "dark" && "border-primary bg-accent"
							)}
						>
							<Moon className="h-4 w-4" />
							Dark
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setTheme("system")}
							className={cn(
								"justify-start gap-2",
								theme === "system" && "border-primary bg-accent"
							)}
						>
							<Monitor className="h-4 w-4" />
							System
						</Button>
					</div>
				</div>

				<DropdownMenuSeparator />

				<div className="p-2">
					<div className="flex items-center justify-between">
						<DropdownMenuLabel className="px-0.5 font-semibold text-muted-foreground text-xs uppercase">
							Color
						</DropdownMenuLabel>
						{overrideColor && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="text-muted-foreground text-xs">
											Managed by connection
										</span>
									</TooltipTrigger>
									<TooltipContent>
										App uses connection color when active.
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
					<div className="grid grid-cols-3 gap-2">
						{colors.map(t => (
							<Button
								key={t.value}
								variant="outline"
								disabled={!!overrideColor}
								className={cn(
									"h-8 w-full justify-start gap-2 px-2",
									(overrideColor ? overrideColor : color) === t.value &&
										"border-transparent ring-1 ring-primary"
								)}
								onClick={() => setColor(t.value)}
							>
								<span
									className={cn("h-4 w-4 shrink-0 rounded-full", t.class)}
								/>
								<span className="text-xs capitalize">{t.label}</span>
							</Button>
						))}
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default ToggleThemeButton;
