import { createContext, useContext } from "react";

export type ScreenServiceContextType = {};

const Context = createContext<ScreenServiceContextType | null>(null);

export const ScreenService = {
	Context,
	Provider: Context.Provider,

	useState() {
		const state = useContext(Context);
		if (state == null) {
			throw new Error("ScreenService not found");
		}
		return state;
	},

	useProvidedState(): ScreenServiceContextType {
		return {};
	},
};
