import type WS from "ws";

export type JSONSerializable =
	| boolean
	| number
	| string
	| null
	| ReadonlyArray<JSONSerializable>
	| { [key: string]: JSONSerializable };

export interface PageFromDevice {
	id: string;
	title: string;
	vm: string;
	app: string;
	capabilities: Record<string, boolean>;
}

export type Page = Omit<PageFromDevice, "capabilities"> & {
	capabilities: NonNullable<PageFromDevice["capabilities"]>;
};

export type WrappedEvent = {
	event: "wrappedEvent";
	payload: {
		pageId: string;
		wrappedEvent: string;
	};
};

// Request sent from Inspector Proxy to Device when new debugger is connected
// to particular page.
export type ConnectRequest = {
	event: "connect";
	payload: { pageId: string };
};

// Request sent from Inspector Proxy to Device to notify that debugger is
// disconnected.
export type DisconnectRequest = {
	event: "disconnect";
	payload: { pageId: string };
};

// Request sent from Inspector Proxy to Device to get a list of pages.
export type GetPagesRequest = { event: "getPages" };

export type GetPagesResponse = {
	event: "getPages";
	payload: ReadonlyArray<PageFromDevice>;
};

export type MessageFromDevice =
	| GetPagesResponse
	| WrappedEvent
	| DisconnectRequest;

// Union type for all possible messages sent from Inspector Proxy to device.
export type MessageToDevice =
	| GetPagesRequest
	| WrappedEvent
	| ConnectRequest
	| DisconnectRequest;

export type PageDescription = {
	id: string;
	title: string;
	appId: string;
	description: string;
	type: string;
	devtoolsFrontendUrl: string;
	webSocketDebuggerUrl: string;

	// React Native specific fields
	/** @deprecated Prefer `title` */
	deviceName: string;
	/** @deprecated This is sent from legacy targets only */
	vm?: string;

	// React Native specific metadata
	reactNative: {
		logicalDeviceId: string;
		capabilities: Page["capabilities"];
	};
};

export interface CDPMessage {
	id?: number;
	method?: string;
	params?: any;
	result?: any;
}

export interface DebuggerConnection {
	socket: WS;
	originalSourceURLAddress?: string;
	prependedFilePrefix: boolean;
	pageId: string;
	userAgent: string | null;
	customHandler: any | null;
}

type SuccessResult<Props extends Record<string, any> = {}> = {
	status: "success";
} & Props;

type ErrorResult<ErrorT = unknown> = {
	status: "error";
	error: ErrorT;
	prefersFuseboxFrontend?: boolean | null;
};

type CodedErrorResult<ErrorCode extends string> = {
	status: "coded_error";
	errorCode: ErrorCode;
	errorDetails?: string;
};

type DebuggerSessionIDs = {
	appId: string;
	deviceName: string;
	deviceId: string;
	pageId: string | null;
};

export type ReportableEvent =
	| ({
			type: "launch_debugger_frontend";
			launchType: "launch" | "redirect";
	  } & (
			| SuccessResult<{
					appId: string | null;
					deviceId: string | null;
					resolvedTargetDescription: string;
					resolvedTargetAppId: string;
					prefersFuseboxFrontend: boolean;
			  }>
			| ErrorResult
			| CodedErrorResult<"NO_APPS_FOUND">
	  ))
	| ({
			type: "connect_debugger_frontend";
	  } & (
			| SuccessResult<
					{
						frontendUserAgent: string | null;
					} & DebuggerSessionIDs
			  >
			| ErrorResult
	  ))
	| ({
			type: "debugger_command";
			protocol: "CDP";
			method: string | null;
			requestOrigin: "proxy" | "debugger" | null;
			responseOrigin: "proxy" | "device";
			timeSinceStart: number | null;
			frontendUserAgent: string | null;
			prefersFuseboxFrontend: boolean | null;
	  } & DebuggerSessionIDs &
			(
				| SuccessResult
				| CodedErrorResult<
						| "TIMED_OUT"
						| "DEVICE_DISCONNECTED"
						| "DEBUGGER_DISCONNECTED"
						| "UNMATCHED_REQUEST_ID"
						| "PROTOCOL_ERROR"
				  >
			))
	| ({
			type: "proxy_error";
			status: "error";
			messageOrigin: "debugger" | "device";
			message: string;
			error: string;
			errorStack: string;
	  } & DebuggerSessionIDs);

export interface EventReporter {
	logEvent(event: ReportableEvent): void;
}

export type ExposedDevice = {
	appId: string;
	id: string;
	name: string;
	sendMessage: (message: JSONSerializable) => void;
};

export type ExposedDebugger = {
	userAgent: string | null;
	sendMessage: (message: JSONSerializable) => void;
};

export type CustomMessageHandlerConnection = {
	page: Page;
	device: ExposedDevice;
	debugger: ExposedDebugger;
};

export type CreateCustomMessageHandlerFn = (
	connection: CustomMessageHandlerConnection,
) => CustomMessageHandler;

export interface CustomMessageHandler {
	/**
	 * Handle a CDP message coming from the device.
	 * This is invoked before the message is sent to the debugger.
	 * When returning true, the message is considered handled and will not be sent to the debugger.
	 */
	handleDeviceMessage(message: JSONSerializable): boolean;

	/**
	 * Handle a CDP message coming from the debugger.
	 * This is invoked before the message is sent to the device.
	 * When returning true, the message is considered handled and will not be sent to the device.
	 */
	handleDebuggerMessage(message: JSONSerializable): boolean;
}
