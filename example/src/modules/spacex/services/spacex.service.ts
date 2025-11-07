import {useContext, createContext, useMemo} from 'react';
import SpacexClient from '../spacex.client.ts';

export type SpacexServiceContextType = {
  client: SpacexClient;
};

const Context = createContext<SpacexServiceContextType | null>(null);

export const SpacexService = {
  Context,
  Provider: Context.Provider,

  useState() {
    const state = useContext(Context);
    if (state == null) {
      throw new Error('SpacexService not found');
    }
    return state;
  },

  useProvidedState(): SpacexServiceContextType {
    const client = useMemo(() => new SpacexClient(), []);

    return {
      client,
    };
  },
};
