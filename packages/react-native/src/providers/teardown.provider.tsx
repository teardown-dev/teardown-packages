import { useEffect, useMemo } from "react";

import type { TeardownCore } from "../teardown.core";
import { TeardownContext } from "../contexts/teardown.context";
import { ForceUpdateProvider } from "./force-update.provider";

export { useTeardown } from "../contexts/teardown.context";

export type TeardownProviderProps = {
	children: React.ReactNode;
	core: TeardownCore;
	forceUpdateFallback?: React.ReactNode;
};

export const TeardownProvider = (props: TeardownProviderProps) => {
	const { children, core, forceUpdateFallback } = props;
	const context = useMemo(() => ({ core }), [core]);

	useEffect(() => {
		return () => {
			core.shutdown();
		};
	}, [core.shutdown]);

	return (
		<TeardownContext.Provider value={context}>
			<InternalProvider forceUpdateFallback={forceUpdateFallback}>
				{children}
			</InternalProvider>
		</TeardownContext.Provider>
	);
};

export type InternalProviderProps = {
	children: React.ReactNode;
	forceUpdateFallback?: React.ReactNode;
};

const InternalProvider = (props: InternalProviderProps) => {
	const { children, forceUpdateFallback } = props;
	return (
		<ForceUpdateProvider fallback={forceUpdateFallback}>
			{children}
		</ForceUpdateProvider>
	);
};
