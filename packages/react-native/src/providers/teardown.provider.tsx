import { memo, useEffect, useMemo } from "react";

import { TeardownContext } from "../contexts/teardown.context";
import type { TeardownCore } from "../teardown.core";

export { useTeardown } from "../contexts/teardown.context";

export type TeardownProviderProps = {
	children: React.ReactNode;
	core: TeardownCore;
};

export const TeardownProvider = memo((props: TeardownProviderProps) => {
	const { children, core } = props;
	const context = useMemo(() => ({ core }), [core]);

	useEffect(() => {
		return () => {
			core.shutdown();
		};
	}, [core]);

	return <TeardownContext.Provider value={context}>{children}</TeardownContext.Provider>;
});
