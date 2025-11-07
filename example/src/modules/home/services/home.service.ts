import {useContext, createContext, useState, useMemo, useEffect} from 'react';
import {ControlService} from './control.service.ts';
import {State} from './state.service.ts';

export type HomeServiceContextType = {
  control: ControlService;
};

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
    const control = useMemo(() => {
      return new ControlService();
    }, []);

    return {
      control,
    };
  },

  useCurrentState() {
    const {control} = this.useState();

    const [state, setState] = useState<State>(
      control.stateService.getCurrentState().state,
    );

    useEffect(() => {
      const listener = control.stateService.emitter.on(
        'HISTORY_STATE_CHANGED',
        () => {
          setState(control.stateService.getCurrentState().state);
        },
      );

      return () => {
        listener.remove();
      };
    }, [control.stateService]);

    return state;
  },

  useBottomSheetLayout() {
    const {control} = HomeService.useState();

    const [layout, setLayout] = useState(
      control.bottomSheetService.getLayout(),
    );

    useEffect(() => {
      const listener = control.bottomSheetService.emitter.on(
        'BOTTOM_SHEET_LAYOUT_CHANGED',
        event => {
          setLayout(event.payload.newLayout);
        },
      );

      return () => {
        listener.remove();
      };
    }, [control.bottomSheetService.emitter]);

    return layout;
  },
};
