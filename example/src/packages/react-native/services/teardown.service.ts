import {useContext, createContext} from "react";
import {TeardownClient} from "../teardown.client";

export type TeardownServiceContextType = {
	client: TeardownClient;
};

const Context = createContext<TeardownServiceContextType | null>(null);

export const TeardownService = {
    Context,
    Provider: Context.Provider,

    useState() {
        const state = useContext(Context);
        if (state == null) {
            throw new Error("TeardownService not found");
        }
        return state;
    },

    useProvidedState(client: TeardownClient): TeardownServiceContextType {
        return {
			client
        };
    },
};
