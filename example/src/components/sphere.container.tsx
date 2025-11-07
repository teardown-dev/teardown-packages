import {FunctionComponent, PropsWithChildren} from 'react';
import {SphereService} from './sphere.service';

export type SphereContainerProps = PropsWithChildren<{}>;

export const SphereContainer: FunctionComponent<
  SphereContainerProps
> = props => {
  const {children} = props;

  const providedState = SphereService.useProvidedState();

  return (
    <SphereService.Provider value={providedState}>
      {children}
    </SphereService.Provider>
  );
};
