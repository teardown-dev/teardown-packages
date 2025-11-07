import {useContext, createContext, useState} from 'react';

export type Mode = {
  type: '';
};

export type HomeServiceContextType = {};

const Context = createContext<HomeServiceContextType | null>(null);

export const HomeService = {
  Context,
  Provider: Context.Provider,

  useState() {
    const state = useContext(Context);
    if (state == null) {
      throw new Error('HomeService not found');
    }
    return state;
  },

  useProvidedState(): HomeServiceContextType {
    const [mode, setMode] = useState<Mode>({
      type: '',
    });

    return {};
  },
};
