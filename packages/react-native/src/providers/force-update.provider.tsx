import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { VersionStatus } from "../clients/force-update";
import { useTeardown } from "./teardown.provider";

export type ForceUpdateContextType = {
  versionStatus: VersionStatus;
  isUpdateRequired: boolean;
  isUpdateAvailable: boolean;
};

const ForceUpdateContext = createContext<ForceUpdateContextType | null>(null);

export const useForceUpdate = () => {
  const context = useContext(ForceUpdateContext);
  if (!context) {
    throw new Error("useForceUpdate must be used within a ForceUpdateProvider");
  }
  return context;
};

export type ForceUpdateProviderProps = {
  children: React.ReactNode;
};

export const ForceUpdateProvider = (props: ForceUpdateProviderProps) => {
  const { children } = props;
  const { core } = useTeardown();

  const [versionStatus, setVersionStatus] = useState<VersionStatus>(
    core.forceUpdate.getVersionStatus()
  );

  useEffect(() => {
    const unsubscribe = core.forceUpdate.onVersionStatusChange(setVersionStatus);
    return unsubscribe;
  }, [core.forceUpdate]);

  const context = useMemo(
    () => ({
      versionStatus,
      isUpdateRequired: versionStatus.type === "update_required",
      isUpdateAvailable: versionStatus.type === "update_available",
    }),
    [versionStatus]
  );

  return (
    <ForceUpdateContext.Provider value={context}>
      {children}
    </ForceUpdateContext.Provider>
  );
};
