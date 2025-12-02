import { useEffect, useState } from "react";
import type { VersionStatus } from "../clients/force-update";
import { useTeardown } from "../contexts/teardown.context";

export type UseForceUpdateResult = {
  /**
   * The current version status.
   */
  versionStatus: VersionStatus;
  /**
   * Whether an update is available for this version, but is not required.
   */
  isUpdateAvailable: boolean;
  /**
   * Whether the the current version is out of date and is forced to be updated. "force_update" - isUpdateAvailable will also be true if this is true.
   */
  isUpdateRequired: boolean;
};

export const useForceUpdate = (): UseForceUpdateResult => {
  const { core } = useTeardown();

  const [versionStatus, setVersionStatus] = useState<VersionStatus>(
    core.forceUpdate.getVersionStatus()
  );

  useEffect(() => {
    const unsubscribe = core.forceUpdate.onVersionStatusChange(setVersionStatus);
    return unsubscribe;
  }, [core.forceUpdate]);

  return {
    versionStatus,
    isUpdateRequired: versionStatus.type === "update_required",
    isUpdateAvailable: versionStatus.type === "update_available",
  };
};

