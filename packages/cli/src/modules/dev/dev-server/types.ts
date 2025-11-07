import type { FastifyBaseLogger } from 'fastify';
import type { WebSocketServer } from 'ws';
import type { SymbolicatorDelegate } from './plugins/symbolicate';

export type {
  SymbolicatorDelegate,
  ReactNativeStackFrame,
  InputStackFrame,
  StackFrame,
  CodeFrame,
  SymbolicatorResults,
} from './plugins/symbolicate';



/** Representation of the compilation progress. */
export interface ProgressData {
  /** Number of modules built. */
  completed: number;

  /** Total number of modules detect as part of compilation. */
  total: number;
}

/**
 * Type representing a function to send the progress.
 *
 * Used by {@link CompilerDelegate} in `getAsset` function to send the compilation
 * progress to the client who requested the asset.
 */
export type SendProgress = (data: ProgressData) => void;

/**
 * Internal types. Do not use.
 *
 * @internal
 */
export namespace Internal {
  export enum EventTypes {
    BuildStart = 'BuildStart',
    BuildEnd = 'BuildEnd',
    HmrEvent = 'HmrEvent',
  }
}
