import {useContext, createContext} from "react";
import type {PluginTuple, TeardownClient} from "../teardown.client";

export type TeardownServiceContextType<T extends readonly PluginTuple[]> = {
	client: TeardownClient<T>
};

const Context = createContext<TeardownServiceContextType<any> | null>(null);

export const TeardownService = {
    Context,
    Provider: Context.Provider,

    useState<T extends readonly PluginTuple[]>() {
        const state = useContext(Context);
        if (state == null) {
            throw new Error("TeardownService not found");
        }
        return state as TeardownServiceContextType<T>
    },

    useProvidedState<T extends readonly PluginTuple[]>(client: TeardownClient<T>): TeardownServiceContextType<T> {
        return {
			client
        };
    },
};
