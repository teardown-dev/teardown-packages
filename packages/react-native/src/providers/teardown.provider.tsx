import type { TeardownCore } from "@/teardown.core";
import { createContext, useContext, useEffect, useMemo } from "react";
import { ForceUpdateProvider } from "./force-update.provider";

export type TeardownContextType = {
	core: TeardownCore;
};

const TeardownContext = createContext<TeardownContextType | null>(null);

export const useTeardown = () => {
	const context = useContext(TeardownContext);
	if (!context) {
		throw new Error("useTeardown must be used within a TeardownProvider");
	}
	return context;
};

export type TeardownProviderProps = {
	children: React.ReactNode;
	core: TeardownCore;
};

export const TeardownProvider = (props: TeardownProviderProps) => {
	const { children, core } = props;
	const context = useMemo(() => ({ core }), [core]);

	useEffect(() => {
		return () => {
			core.shutdown();
		};
	}, [core.shutdown]);

	return (
		<TeardownContext.Provider value={context}>
			<InternalProvider>{children}</InternalProvider>
		</TeardownContext.Provider>
	);
};

export type InternalProviderProps = {
	children: React.ReactNode;
};

const InternalProvider = (props: InternalProviderProps) => {

	const { children } = props;
	return (
		<ForceUpdateProvider>{children}</ForceUpdateProvider>
	)

}