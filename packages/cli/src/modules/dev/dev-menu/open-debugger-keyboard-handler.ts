import type { TeardownTerminalReporter } from "../terminal/terminal.reporter";
// @ts-ignore
import chalk from "chalk";
import open from "open";

interface OpenDebuggerConfig {
	reporter: TeardownTerminalReporter;
	devServerUrl: string;
}

interface Target {
	name: string;
	url: string;
}

export default class OpenDebuggerKeyboardHandler {
	private readonly reporter: TeardownTerminalReporter;
	private readonly devServerUrl: string;
	private isTargetSelectionActive = false;
	private targets: Target[] = [];

	constructor(config: OpenDebuggerConfig) {
		this.reporter = config.reporter;
		this.devServerUrl = config.devServerUrl;
	}

	public async handleOpenDebugger(): Promise<void> {
		try {
			const response = await fetch(`${this.devServerUrl}/json`);
			const pages = await response.json();

			this.targets = pages.map((page: any) => ({
				name: page.title,
				url: page.devtoolsFrontendUrl,
			}));

			if (this.targets.length === 0) {
				this.reporter.update({
					type: "client_log",
					level: "info",
					data: ["No available debugging targets"],
				});
				return;
			}

			if (this.targets.length === 1) {
				await this.openTarget(this.targets[0]);
				return;
			}

			this.showTargetSelection();
		} catch (error) {
			this.reporter.update({
				type: "client_log",
				level: "warn",
				data: [
					`Failed to open debugger: ${error instanceof Error ? error.message : String(error)}`,
				],
			});
		}
	}

	public maybeHandleTargetSelection(key: string): boolean {
		if (!this.isTargetSelectionActive) {
			return false;
		}

		const targetIndex = Number.parseInt(key, 10) - 1;
		if (targetIndex >= 0 && targetIndex < this.targets.length) {
			void this.openTarget(this.targets[targetIndex]);
			this.dismiss();
			return true;
		}

		if (key === "escape") {
			this.dismiss();
			return true;
		}

		return false;
	}

	public dismiss(): void {
		this.isTargetSelectionActive = false;
		this.targets = [];
	}

	private async openTarget(target: Target): Promise<void> {
		try {
			console.log("openTarget", target.url);
			await open(target.url);
			this.reporter.update({
				type: "client_log",
				level: "info",
				data: [`Opening debugger for: ${target.name}`],
			});
		} catch (error) {
			this.reporter.update({
				type: "client_log",
				// @ts-ignore
				level: "error",
				data: [
					`Failed to open debugger: ${error instanceof Error ? error.message : String(error)}`,
				],
			});
		}
	}

	private showTargetSelection(): void {
		this.isTargetSelectionActive = true;

		const targetList = this.targets
			.map(
				(target, i) => `  ${chalk.bold.inverse(` ${i + 1} `)} ${target.name}`,
			)
			.join("\n");

		this.reporter.update({
			type: "client_log",
			level: "info",
			data: [
				`Select a target to debug:\n${targetList}\n\n  ${chalk.bold.inverse(" ESC ")} to cancel\n`,
			],
		});
	}
}
