import { createContext, useContext } from "react";

import type { VersionStatus } from "../clients/force-update";

export type ForceUpdateContextType = {
	versionStatus: VersionStatus;
	isUpdateRequired: boolean;
	isUpdateAvailable: boolean;
};

export const ForceUpdateContext = createContext<ForceUpdateContextType | null>(null);

export const useForceUpdate = () => {
	const context = useContext(ForceUpdateContext);
	if (!context) {
		throw new Error("useForceUpdate must be used within a ForceUpdateProvider");
	}
	return context;
};
