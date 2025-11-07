import util from "node:util";
import { Terminal } from "metro-core";

// @ts-ignore
import chalk from "chalk";
import type { TerminalReportableEvent } from "metro/src/lib/TerminalReporter";
import { KeyboardHandlerManager } from "../dev-menu/keyboard-handler";
import type { DevServer } from "../dev-server/dev-server";
import { BaseTerminalReporter } from "./base.terminal.reporter";

class LogRespectingTerminal extends Terminal {
	constructor(
		stream: import("node:net").Socket | import("node:stream").Writable,
	) {
		super(stream);

		const sendLog = (...args: any[]) => {
			// @ts-expect-error
			this._logLines.push(
				// format args like console.log
				util.format(...args),
			);
			// @ts-expect-error
			this._scheduleUpdate();

			// Flush the logs to the terminal immediately so logs at the end of the process are not lost.
			this.flush();
		};

		console.log = sendLog;
		console.info = sendLog;
	}
}

const terminal = new LogRespectingTerminal(process.stdout);

export class TeardownTerminalReporter extends BaseTerminalReporter {
	constructor(readonly devServer: DevServer) {
		super(terminal);
	}

	_log(event: TerminalReportableEvent): void {
		switch (event.type) {
			// Handle specific cases if needed
			case "dep_graph_loading":
				this.dependencyGraphLoading(event.hasReducedPerformance);
				return;
		}
		super._log(event);
	}

	_logInitializing(port: number, hasReducedPerformance: boolean) {
		this.terminal.log(
			chalk.dim("Starting Bundler on port"),
			chalk.dim(`${port}`),
		);
	}

	dependencyGraphLoading(hasReducedPerformance: boolean) {
		this.terminal.log(
			chalk.dim("Loading dependency graph"),
			chalk.dim(`${hasReducedPerformance ? "with reduced performance" : ""}`),
		);
	}

	_logWorkerChunk(origin: "stdout" | "stderr", chunk: string): void {
		const lines = chunk.split("\n");
		if (lines.length >= 1 && lines[lines.length - 1] === "") {
			lines.splice(lines.length - 1, 1);
		}

		const originTag = origin === "stdout" ? chalk.dim("|") : chalk.yellow("|");
		lines.forEach((line: string) => {
			this.terminal.log(originTag, line);
		});
	}

	update(event: TerminalReportableEvent): void {
		super.update(event);

		this.devServer?.reportMetroEvent(event);

		switch (event.type as string) {
			case "initialize_done":
				this.devServer.onInitializeDone?.();
				break;
		}
	}
}
