import { debounce } from "lodash";
import { useMemo, useRef, useState } from "react";

export const useDebouncedState = <State>(
  initialState: State,
  delay: number,
) => {
  const [state, setState] = useState<State>(initialState);
  const lastSetState = useRef(Date.now());

  const setDebouncedState = useMemo(
    () =>
      debounce((newState) => {
        setState(newState);
        lastSetState.current = Date.now();
      }, delay),
    [delay],
  );

  return useMemo(() => {
    return [state, setDebouncedState, lastSetState] as const;
  }, [setDebouncedState, state]);
};
