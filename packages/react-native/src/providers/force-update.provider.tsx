

import { createContext, useContext, useMemo, useState } from "react";

export type ForceUpdateContextType = {
  isForceUpdate: boolean;
  setIsForceUpdate: (isForceUpdate: boolean) => void;
}

const ForceUpdateContext = createContext<ForceUpdateContextType | null>(null);

export const useForceUpdate = () => {
  const context = useContext(ForceUpdateContext);
  if (!context) {
    throw new Error("useForceUpdate must be used within a ForceUpdateProvider");
  }
  return context;
}

export type ForceUpdateProviderProps = {
  children: React.ReactNode;
}

export const ForceUpdateProvider = (props: ForceUpdateProviderProps) => {
  const { children } = props;

  const [isForceUpdate, setIsForceUpdate] = useState(false);

  const context = useMemo(() => ({
    isForceUpdate,
    setIsForceUpdate,
  }), [isForceUpdate]);

  return (
    <ForceUpdateContext.Provider value={context}>
      {children}
    </ForceUpdateContext.Provider>
  );
}