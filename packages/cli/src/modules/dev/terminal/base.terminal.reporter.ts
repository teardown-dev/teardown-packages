import { TerminalReporter as MetroTerminalReporter } from "metro";
import type { TerminalReportableEvent } from "metro/src/lib/TerminalReporter";

export class BaseTerminalReporter extends MetroTerminalReporter {
	// constructor(terminal: Terminal) {
	// 	super(terminal);
	// }

	update(event: TerminalReportableEvent): void {
		// @ts-ignore
		super.update(event);
	}

	_getElapsedTime(startTime: bigint): bigint {
		// @ts-ignore
		return super._getElapsedTime(startTime);
	}

	_log(event: TerminalReportableEvent): void {
		// @ts-ignore
		super._log(event);
	}

	_logInitializing(port: number, hasReducedPerformance: boolean): void {
		// @ts-ignore
		super._logInitializing(port, hasReducedPerformance);
	}

	_logInitializingFailed(port: number, error: Error): void {
		// @ts-ignore
		super._logInitializingFailed(port, error);
	}

	_logBundleBuildDone(buildID: string): void {
		// @ts-ignore
		super._logBundleBuildDone(buildID);
	}

	_logBundleBuildFailed(buildID: string): void {
		// @ts-ignore
		super._logBundleBuildFailed(buildID);
	}

	_logBundlingError(error: Error): void {
		// @ts-ignore
		super._logBundlingError(error);
	}

	_logWorkerChunk(origin: string, chunk: string): void {
		// @ts-ignore
		super._logWorkerChunk(origin, chunk);
	}

	_logHmrClientError(error: Error): void {
		// @ts-ignore
		super._logHmrClientError(error);
	}

	_logWarning(message: string): void {
		// @ts-ignore
		super._logWarning(message);
	}

	_logWatcherHealthCheckResult(result: any): void {
		// @ts-ignore
		super._logWatcherHealthCheckResult(result);
	}

	_logWatcherStatus(status: any): void {
		// @ts-ignore
		super._logWatcherStatus(status);
	}

	_getBundleStatusMessage(
		progress: any,
		phase: "done" | "failed" | "in_progress",
	): string {
		// @ts-ignore
		return super._getBundleStatusMessage(progress, phase);
	}

	_updateBundleProgress(data: {
		buildID: string;
		transformedFileCount: number;
		totalFileCount: number;
	}): void {
		// @ts-ignore
		super._updateBundleProgress(data);
	}

	_updateState(event: TerminalReportableEvent): void {
		// @ts-ignore
		super._updateState(event);
	}

	_getStatusMessage(): string {
		// @ts-ignore
		return super._getStatusMessage();
	}
}
