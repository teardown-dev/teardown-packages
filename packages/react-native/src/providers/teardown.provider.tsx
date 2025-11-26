import type { TeardownCore } from "@/teardown.core";
import { createContext, useContext, useMemo } from "react";

// type Opotions = {} | {};

// creatio nla tpe her eto either create a class inatnce or pass one in

export type TeardownContextType = {
	core: TeardownCore;
} | {

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

	// const { core } = useTeardown();

	return <>{children}</>;
};
