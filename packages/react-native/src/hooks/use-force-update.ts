import { useEffect, useState } from "react";
import type { VersionStatus } from "../clients/force-update";
import { useTeardown } from "../contexts/teardown.context";

export interface UseForceUpdateResult {
	/**
	 * The current version status.
	 */
	versionStatus: VersionStatus;
	/**
	 * Whether an update is available for this version, but is not required.
	 */
	isUpdateAvailable: boolean;
	/**
	 * Whether an update is recommended for this version, but is not required.
	 */
	isUpdateRecommended: boolean;
	/**
	 * Whether the the current version is out of date and is forced to be updated.
	 */
	isUpdateRequired: boolean;
}

export const useForceUpdate = (): UseForceUpdateResult => {
	const { core } = useTeardown();

	const [versionStatus, setVersionStatus] = useState<VersionStatus>(core.forceUpdate.getVersionStatus());

	useEffect(() => {
		const unsubscribe = core.forceUpdate.onVersionStatusChange(setVersionStatus);
		return unsubscribe;
	}, [core.forceUpdate]);

	const isUpdateRequired = versionStatus.type === "update_required";
	const isUpdateRecommended = versionStatus.type === "update_recommended";
	const isUpdateAvailable = isUpdateRequired || isUpdateRecommended || versionStatus.type === "update_available";

	return {
		versionStatus,
		isUpdateRequired,
		isUpdateRecommended,
		isUpdateAvailable,
	};
};
