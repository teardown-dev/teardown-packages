import type { JSONSerializable } from "../inspector/types";

type integer = number;

export interface Debugger {
	GetScriptSourceParams: {
		/**
		 * Id of the script to get source for.
		 */
		scriptId: string;
	};

	GetScriptSourceResult: {
		/**
		 * Script source (empty in case of Wasm bytecode).
		 */
		scriptSource: string;

		/**
		 * Wasm bytecode. (Encoded as a base64 string when passed over JSON)
		 */
		bytecode?: string;
	};

	SetBreakpointByUrlParams: {
		/**
		 * Line number to set breakpoint at.
		 */
		lineNumber: integer;

		/**
		 * URL of the resources to set breakpoint on.
		 */
		url?: string;

		/**
		 * Regex pattern for the URLs of the resources to set breakpoints on. Either `url` or
		 * `urlRegex` must be specified.
		 */
		urlRegex?: string;

		/**
		 * Script hash of the resources to set breakpoint on.
		 */
		scriptHash?: string;

		/**
		 * Offset in the line to set breakpoint at.
		 */
		columnNumber?: integer;

		/**
		 * Expression to use as a breakpoint condition. When specified, debugger will only stop on the
		 * breakpoint if this expression evaluates to true.
		 */
		condition?: string;
	};

	ScriptParsedEvent: {
		/**
		 * Identifier of the script parsed.
		 */
		scriptId: string;

		/**
		 * URL or name of the script parsed (if any).
		 */
		url: string;

		/**
		 * URL of source map associated with script (if any).
		 */
		sourceMapURL: string;
	};
}

export type Events = {
	"Debugger.scriptParsed": Debugger["ScriptParsedEvent"];
	[method: string]: JSONSerializable;
};

export type Commands = {
	"Debugger.getScriptSource": {
		paramsType: Debugger["GetScriptSourceParams"];
		resultType: Debugger["GetScriptSourceResult"];
	};
	"Debugger.setBreakpointByUrl": {
		paramsType: Debugger["SetBreakpointByUrlParams"];
		resultType: null;
	};
	[method: string]: {
		paramsType: JSONSerializable;
		resultType: JSONSerializable;
	};
};

// Note: A CDP event is a JSON-RPC notification with no `id` member.
export type CDPEvent<TEvent extends keyof Events = "unknown"> = {
	method: TEvent;
	params: Events[TEvent];
};

export type CDPRequest<TCommand extends keyof Commands = "unknown"> = {
	method: TCommand;
	params: Commands[TCommand]["paramsType"];
	id: number;
};

export type CDPResponse<TCommand extends keyof Commands = "unknown"> =
	| {
			result: Commands[TCommand]["resultType"];
			id: number;
	  }
	| {
			error: CDPRequestError;
			id: number;
	  };

export type CDPRequestError = {
	code: number;
	message: string;
	data?: JSONSerializable;
};

export type CDPClientMessage =
	| CDPRequest<"Debugger.getScriptSource">
	| CDPRequest<"Debugger.scriptParsed">
	| CDPRequest<"Debugger.setBreakpointByUrl">
	| CDPRequest<never>;

export type CDPServerMessage = {
	method: string;
	params: any;
} & (
	| CDPEvent<"Debugger.scriptParsed">
	| CDPEvent<never>
	| CDPResponse<"Debugger.getScriptSource">
	| CDPResponse<never>
);
