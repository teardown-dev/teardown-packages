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
      if (state.type === "identified") {
        setSession(state.session);
      } else {
        setSession(null);
      }
    });
    return unsubscribe;
  }, [core.identity]);

  return session;
};