import {FunctionComponent, PropsWithChildren} from 'react';
import {HomeService} from '../services/home.service.ts';

export type HomeContainerProps = PropsWithChildren<{}>;

export const HomeContainer: FunctionComponent<HomeContainerProps> = props => {
  const {children} = props;

  const providedState = HomeService.useProvidedState();

  return (
    <HomeService.Provider value={providedState}>
      {children}
    </HomeService.Provider>
  );
};
