import type { FunctionComponent, PropsWithChildren } from "react";
import { ScreenService } from "../services/screen.service";

export type ScreenContainerProps = PropsWithChildren<{}>;

export const ScreenContainer: FunctionComponent<ScreenContainerProps> = (
	props,
) => {
	const { children } = props;

	const providedState = ScreenService.useProvidedState();

	return (
		<ScreenService.Provider value={providedState}>
			{children}
		</ScreenService.Provider>
	);
};
