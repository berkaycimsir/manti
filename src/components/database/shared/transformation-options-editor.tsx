"use client";

import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { DATE_FORMATS } from "~/lib/constants/transformation-options";
import type { TransformationType } from "~/types/transformations";

interface TransformationOptionsEditorProps {
	type: TransformationType;
	options: Record<string, unknown>;
	onChange: (options: Record<string, unknown>) => void;
	compact?: boolean;
}

export function TransformationOptionsEditor({
	type,
	options,
	onChange,
	compact = false,
}: TransformationOptionsEditorProps) {
	const updateOption = (key: string, value: unknown) => {
		onChange({ ...options, [key]: value });
	};

	const inputClass = compact ? "h-8" : "h-9";
	const labelClass = "text-muted-foreground text-xs";

	switch (type) {
		case "date":
			return (
				<div className="space-y-2">
					<span className={labelClass}>Date Format</span>
					<Select
						value={(options.format as string) || "YYYY-MM-DD HH:mm:ss"}
						onValueChange={v => updateOption("format", v)}
					>
						<SelectTrigger className={inputClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{DATE_FORMATS.map(f => (
								<SelectItem key={f.value} value={f.value}>
									{f.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			);

		case "number":
			return (
				<div className="grid grid-cols-3 gap-2">
					<div>
						<span className={labelClass}>Decimals</span>
						<Input
							type="number"
							value={(options.decimals as number) ?? 2}
							onChange={e =>
								updateOption("decimals", Number.parseInt(e.target.value, 10))
							}
							className={`mt-1 ${inputClass}`}
						/>
					</div>
					<div>
						<span className={labelClass}>Prefix</span>
						<Input
							value={(options.prefix as string) ?? ""}
							onChange={e => updateOption("prefix", e.target.value)}
							placeholder="$"
							className={`mt-1 ${inputClass}`}
						/>
					</div>
					<div>
						<span className={labelClass}>Suffix</span>
						<Input
							value={(options.suffix as string) ?? ""}
							onChange={e => updateOption("suffix", e.target.value)}
							placeholder="%"
							className={`mt-1 ${inputClass}`}
						/>
					</div>
				</div>
			);

		case "boolean":
			return (
				<div className="grid grid-cols-2 gap-2">
					<div>
						<span className={labelClass}>True Label</span>
						<Input
							value={(options.trueLabel as string) ?? "✓ Yes"}
							onChange={e => updateOption("trueLabel", e.target.value)}
							className={`mt-1 ${inputClass}`}
						/>
					</div>
					<div>
						<span className={labelClass}>False Label</span>
						<Input
							value={(options.falseLabel as string) ?? "✗ No"}
							onChange={e => updateOption("falseLabel", e.target.value)}
							className={`mt-1 ${inputClass}`}
						/>
					</div>
				</div>
			);

		case "truncate":
			return (
				<div className="grid grid-cols-2 gap-2">
					<div>
						<span className={labelClass}>Max Length</span>
						<Input
							type="number"
							value={(options.maxLength as number) ?? 50}
							onChange={e =>
								updateOption("maxLength", Number.parseInt(e.target.value, 10))
							}
							className={`mt-1 ${inputClass}`}
						/>
					</div>
					<div>
						<span className={labelClass}>Suffix</span>
						<Input
							value={(options.suffix as string) ?? "..."}
							onChange={e => updateOption("suffix", e.target.value)}
							className={`mt-1 ${inputClass}`}
						/>
					</div>
				</div>
			);

		case "mask":
			return (
				<div className="grid grid-cols-3 gap-2">
					<div>
						<span className={labelClass}>Mask Char</span>
						<Input
							value={(options.maskChar as string) ?? "*"}
							onChange={e => updateOption("maskChar", e.target.value)}
							maxLength={1}
							className={`mt-1 ${inputClass}`}
						/>
					</div>
					<div>
						<span className={labelClass}>Show First</span>
						<Input
							type="number"
							value={(options.showFirst as number) ?? 0}
							onChange={e =>
								updateOption("showFirst", Number.parseInt(e.target.value, 10))
							}
							className={`mt-1 ${inputClass}`}
						/>
					</div>
					<div>
						<span className={labelClass}>Show Last</span>
						<Input
							type="number"
							value={(options.showLast as number) ?? 4}
							onChange={e =>
								updateOption("showLast", Number.parseInt(e.target.value, 10))
							}
							className={`mt-1 ${inputClass}`}
						/>
					</div>
				</div>
			);

		case "json":
			return (
				<div className="w-32">
					<span className={labelClass}>Indent</span>
					<Input
						type="number"
						value={(options.indent as number) ?? 2}
						onChange={e =>
							updateOption("indent", Number.parseInt(e.target.value, 10))
						}
						className={`mt-1 ${inputClass}`}
					/>
				</div>
			);

		default:
			return null;
	}
}
