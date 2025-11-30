import { useEffect, useMemo, useState } from "react";

import type { VersionStatus } from "../clients/force-update";
import { ForceUpdateContext } from "../contexts/force-update.context";
import { useTeardown } from "../contexts/teardown.context";

export { useForceUpdate } from "../contexts/force-update.context";

export type ForceUpdateProviderProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export const ForceUpdateProvider = (props: ForceUpdateProviderProps) => {
  const { children, fallback } = props;
  const { core } = useTeardown();

  const [versionStatus, setVersionStatus] = useState<VersionStatus>(
    core.forceUpdate.getVersionStatus()
  );

  useEffect(() => {
    const unsubscribe = core.forceUpdate.onVersionStatusChange(setVersionStatus);
    return unsubscribe;
  }, [core.forceUpdate]);

  const isUpdateRequired = versionStatus.type === "update_required";

  const context = useMemo(
    () => ({
      versionStatus,
      isUpdateRequired,
      isUpdateAvailable: versionStatus.type === "update_available",
    }),
    [versionStatus, isUpdateRequired]
  );

  return (
    <ForceUpdateContext.Provider value={context}>
      {isUpdateRequired && fallback ? fallback : children}
    </ForceUpdateContext.Provider>
  );
};
