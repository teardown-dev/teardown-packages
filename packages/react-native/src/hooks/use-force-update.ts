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
	/**
	 * Release notes for the update, if available.
	 * Only present when there's an update (update_available, update_recommended, or update_required).
	 */
	releaseNotes: string | null;
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

	// Extract release notes from update status types
	const releaseNotes =
		versionStatus.type === "update_available" ||
		versionStatus.type === "update_recommended" ||
		versionStatus.type === "update_required"
			? (versionStatus.releaseNotes ?? null)
			: null;

	return {
		versionStatus,
		isUpdateRequired,
		isUpdateRecommended,
		isUpdateAvailable,
		releaseNotes,
	};
};
