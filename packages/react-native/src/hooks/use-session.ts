import { useEffect, useState } from "react";
import type { Session } from "../clients/identity/identity.client";
import { useTeardown } from "../contexts/teardown.context";

export type UseSessionResult = Session | null

export const useSession = (): UseSessionResult => {
  const { core } = useTeardown();

  const [session, setSession] = useState<Session | null>(
    core.identity.getSessionState()
  );

  useEffect(() => {
    const unsubscribe = core.identity.onIdentifyStateChange((state) => {
      switch (state.type) {
        case "identified":
          setSession(state.session);
          break;
        case "unidentified":
          setSession(null);
          break;
      }
    });
    return unsubscribe;
  }, [core.identity]);

  return session;
};