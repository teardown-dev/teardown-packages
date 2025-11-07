import readline from "node:readline";
import { ReadStream } from "node:tty";
// @ts-ignore
import chalk from "chalk";
import type { TeardownTerminalReporter } from "../terminal/terminal.reporter";
import OpenDebuggerKeyboardHandler from "./open-debugger-keyboard-handler";

export interface MessageSocket {
	broadcast: (type: string, params?: Record<string, unknown> | null) => void;
}

interface KeyEvent {
	sequence: string;
	name: string;
	ctrl: boolean;
	meta: boolean;
	shift: boolean;
}

interface KeyboardHandlerConfig {
	devServerUrl: string;
	messageSocket: MessageSocket;
	reporter: TeardownTerminalReporter;
}

export class KeyboardHandlerManager {
	private static readonly CTRL_C = "\u0003";
	private static readonly CTRL_D = "\u0004";
	private static readonly RELOAD_TIMEOUT = 500;

	private readonly devServerUrl: string;
	private readonly messageSocket: MessageSocket;
	private readonly reporter: TeardownTerminalReporter;
	private readonly openDebuggerKeyboardHandler: OpenDebuggerKeyboardHandler;
	private previousCallTimestamp = 0;

	constructor(config: KeyboardHandlerConfig) {
		this.devServerUrl = config.devServerUrl;
		this.messageSocket = config.messageSocket;
		this.reporter = config.reporter;
		this.openDebuggerKeyboardHandler = new OpenDebuggerKeyboardHandler({
			reporter: this.reporter,
			devServerUrl: this.devServerUrl,
		});
	}

	public initialize(): void {
		if (!this.isTTYSupported()) {
			this.reporter.update({
				type: "client_log",
				level: "info",
				data: ["Interactive mode is not supported in this environment"],
			});
			return;
		}

		this.setupKeyboardHandlers();
		this.printAvailableCommands();
	}

	private isTTYSupported(): boolean {
		return process.stdin.isTTY === true;
	}

	private setupKeyboardHandlers(): void {
		readline.emitKeypressEvents(process.stdin);
		this.setRawMode(true);

		process.stdin.on("keypress", (str: string, key: KeyEvent) => {
			this.handleKeyPress(key);
		});
	}

	private handleKeyPress(key: KeyEvent): void {
		if (this.openDebuggerKeyboardHandler.maybeHandleTargetSelection(key.name)) {
			return;
		}

		switch (key.sequence) {
			case "r":
				this.handleReload();
				break;
			case "d":
				this.handleDevMenu();
				break;
			case "j":
				void this.handleOpenDebugger();
				break;
			case KeyboardHandlerManager.CTRL_C:
			case KeyboardHandlerManager.CTRL_D:
				this.handleExit();
				break;
		}
	}

	private handleReload(): void {
		const currentCallTimestamp = new Date().getTime();
		if (
			currentCallTimestamp - this.previousCallTimestamp >
			KeyboardHandlerManager.RELOAD_TIMEOUT
		) {
			this.previousCallTimestamp = currentCallTimestamp;
			this.reporter.update({
				type: "client_log",
				level: "info",
				data: ["Reloading connected app(s)..."],
			});
			this.messageSocket.broadcast("reload", null);
		}
	}

	private handleDevMenu(): void {
		this.reporter.update({
			type: "client_log",
			level: "info",
			data: ["Opening Dev Menu..."],
		});
		this.messageSocket.broadcast("devMenu", null);
	}

	private async handleOpenDebugger(): Promise<void> {
		await this.openDebuggerKeyboardHandler.handleOpenDebugger();
	}

	private handleExit(): void {
		this.openDebuggerKeyboardHandler.dismiss();
		this.reporter.update({
			type: "client_log",
			level: "info",
			data: ["Stopping server"],
		});
		this.setRawMode(false);
		process.stdin.pause();
		process.emit("SIGINT");
		process.exit();
	}

	private setRawMode(enable: boolean): void {
		invariant(
			process.stdin instanceof ReadStream,
			"process.stdin must be a readable stream to modify raw mode",
		);
		process.stdin.setRawMode(enable);
	}

	private printAvailableCommands(): void {
		this.reporter.update({
			type: "client_log",
			level: "info",
			data: [
				"Key commands available:",
				`${chalk.bold.inverse(" r ")} - reload app(s)`,
				`${chalk.bold.inverse(" d ")} - open Dev Menu`,
				`${chalk.bold.inverse(" j ")} - open DevTools`,
			],
		});
	}
}

const invariant = (condition: boolean, message: string) => {
	if (!condition) {
		throw new Error(message);
	}
};
