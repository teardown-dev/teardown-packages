export declare class EdenFetchError<Status extends number = number, Value = unknown> extends Error {
	status: Status;
	value: Value;
	constructor(status: Status, value: Value);
}

export type Range<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;
export type Enumerate<N extends number, Acc extends number[] = []> = Acc["length"] extends N
	? Acc[number]
	: Enumerate<N, [...Acc, Acc["length"]]>;
export type ErrorRange = Range<300, 599>;
export type MapError<T extends Record<number, unknown>> = [
	{
		[K in keyof T]-?: K extends ErrorRange ? K : never;
	}[keyof T],
] extends [infer A extends number]
	? {
			[K in A]: EdenFetchError<K, T[K]>;
		}[A]
	: false;
// biome-ignore lint/suspicious/noExplicitAny: Complex type utility that requires any for union to intersection conversion
export type UnionToIntersect<U> = (U extends any ? (arg: U) => any : never) extends (arg: infer I) => void ? I : never;
export type IsAny<T> = 0 extends 1 & T ? true : false;
export type IsNever<T> = [T] extends [never] ? true : false;
export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;
export type IsExactlyUnknown<T> = [T] extends [unknown] ? ([unknown] extends [T] ? true : false) : false;
export type IsUndefined<T> = [T] extends [undefined] ? true : false;
// biome-ignore lint/complexity/noBannedTypes: Empty object type required for type matching utility
export type IsMatchingEmptyObject<T> = [T] extends [{}] ? ([{}] extends [T] ? true : false) : false;
export type MaybeEmptyObject<
	TObj,
	TKey extends PropertyKey,
	TFallback = Record<string, unknown>,
> = IsUndefined<TObj> extends true
	? {
			[K in TKey]?: TFallback;
		}
	: IsExactlyUnknown<TObj> extends true
		? {
				[K in TKey]?: TFallback;
			}
		: IsMatchingEmptyObject<TObj> extends true
			? {
					[K in TKey]?: TObj;
				}
			: undefined extends TObj
				? {
						[K in TKey]?: TObj;
					}
				: null extends TObj
					? {
							[K in TKey]?: TObj;
						}
					: {
							[K in TKey]: TObj;
						};
export type AnyTypedRoute = {
	body?: unknown;
	headers?: unknown;
	query?: unknown;
	params?: unknown;
	response: Record<number, unknown>;
};
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
export type TreatyToPath<T, Path extends string = ""> = UnionToIntersect<
	T extends Record<string, unknown>
		? {
				[K in keyof T]: T[K] extends AnyTypedRoute
					? {
							[path in Path]: {
								[method in K]: T[K];
							};
						}
					: unknown extends T[K]
						? {
								[path in Path]: {
									[method in K]: T[K];
								};
							}
						: TreatyToPath<T[K], `${Path}/${K & string}`>;
			}[keyof T]
		: // biome-ignore lint/complexity/noBannedTypes: Empty object type required for recursive type utility
			{}
>;
export type Not<T> = T extends true ? false : true;

// biome-ignore lint/suspicious/noExplicitAny: Schema type requires any for flexible endpoint definitions
export type Fn<Schema extends Record<string, any>> = <
	Endpoint extends keyof Schema,
	Method extends Uppercase<Extract<keyof Schema[Endpoint], string>>,
	Route extends Schema[Endpoint][Lowercase<Method>],
>(
	endpoint: Endpoint,
	options: Omit<RequestInit, "body" | "method" | "headers"> &
		("GET" extends Method
			? {
					method?: Method;
				}
			: {
					method: Method;
				}) &
		(IsNever<keyof Route["params"]> extends true
			? {
					params?: Record<never, string>;
				}
			: {
					params: Route["params"];
				}) &
		(IsNever<keyof Route["query"]> extends true
			? {
					query?: Record<never, string>;
				}
			: {
					query: Route["query"];
				}) &
		(undefined extends Route["headers"]
			? {
					headers?: Record<string, string>;
				}
			: {
					headers: Route["headers"];
				}) &
		(IsUnknown<Route["body"]> extends false
			? {
					body: Route["body"];
				}
			: {
					body?: unknown;
				})
) => Promise<
	Prettify<
		| {
				data: Awaited<Route["response"][200]>;
				error: null;
				status: number;
				headers: Record<string, unknown>;
				retry(): Promise<void>;
		  }
		| {
				data: null;
				error: MapError<Route["response"]> extends infer Errors
					? IsNever<Errors> extends true
						? EdenFetchError<number, string>
						: Errors
					: EdenFetchError<number, string>;
				status: number;
				headers: Record<string, unknown>;
				retry(): Promise<void>;
		  }
	>
>;
