import { createContext, useMemo } from "react";
import type { TeardownCore } from "@/teardown.core";

export type TeardownContextType = {
	core: TeardownCore;
};

const TeardownContext = createContext<TeardownContextType | null>(null);

export type TeardownProviderProps = {
	children: React.ReactNode;
	core: TeardownCore;
};

export const TeardownProvider = (props: TeardownProviderProps) => {
	const { children, core } = props;
	const context = useMemo(() => ({ core }), [core]);

	return <TeardownContext.Provider value={context}>{children}</TeardownContext.Provider>;
};
