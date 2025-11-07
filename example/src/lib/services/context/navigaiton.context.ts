import { createContext } from "react";

import { NavigationService } from "../navigation.service";

export type NavigationContextType = {
  navigationService: NavigationService;
};

export const NavigaitonContext = createContext<NavigationContextType | null>(
  null,
);
