import type { FunctionComponent, PropsWithChildren } from "react";
import { CService } from "../services/c.service";

export type Container = PropsWithChildren<{}>;

export const Container: FunctionComponent<Container> = (props) => {
	const { children } = props;

	const providedState = CService.useProvidedState();

	return (
		<CService.Provider value={providedState}>{children}</CService.Provider>
	);
};
