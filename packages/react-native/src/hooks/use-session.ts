import { useEffect, useState } from "react";
import type { IdentifiedSessionState, SessionState } from "../clients/identity/identity.client";
import { useTeardown } from "../contexts/teardown.context";

export interface UseSessionResult {
  /**
   * The current session state.
   */
  session: SessionState;
}

export const useSession = (): UseSessionResult => {
  const { core } = useTeardown();

  const [session, setSession] = useState<IdentifiedSessionState>(
    core.identity.getIdentifyState()
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

  return {
    session,
  };
};

export const useValidSession = (): IdentifiedSessionState | null => {
  const { session } = useSession();
  return session.type === "identified" ? session : null;
};