import { createContext, useContext } from "react";

import type { TeardownCore } from "../teardown.core";

export type TeardownContextType = {
	core: TeardownCore;
};

export const TeardownContext = createContext<TeardownContextType | null>(null);

export const useTeardown = () => {
	const context = useContext(TeardownContext);
	if (!context) {
		throw new Error("useTeardown must be used within a TeardownProvider");
	}
	return context;
};
