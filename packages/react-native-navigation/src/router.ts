import type { FunctionComponent } from "react";
import type { AnyStack } from "./stack";

type Screen<Name, Params> = {
	type: "screen";
	name: Name;
	component: FunctionComponent<{ params: Params }>;
};

type Screens = {
	[key: string]: AnyStack | Screen<any, any>;
};

export type Router<Screens> = {
	root: AnyStack;
	screens?: Screens;
};

export const createRouter = <RouterScreens = any>(
	root: AnyStack,
	screens: RouterScreens,
): Router<RouterScreens> => {
	return {
		root,
		screens,
	};
};
