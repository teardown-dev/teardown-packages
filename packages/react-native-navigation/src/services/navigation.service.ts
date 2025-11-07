import {useContext, createContext} from "react";

export type NavigationServiceContextType = {};

const Context = createContext<NavigationServiceContextType | null>(null);

export const NavigationService = {
    Context,
    Provider: Context.Provider,

    useState() {
        const state = useContext(Context);
        if (state == null) {
            throw new Error("NavigationService not found");
        }
        return state;
    },

    useProvidedState(): NavigationServiceContextType {
        return {};
    },
};
