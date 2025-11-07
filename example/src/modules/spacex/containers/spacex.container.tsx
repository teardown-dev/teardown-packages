import {FunctionComponent, PropsWithChildren} from 'react';
import {SpacexService} from '../services/spacex.service';

export type SpacexContainerProps = PropsWithChildren<{}>;

export const SpacexContainer: FunctionComponent<
  SpacexContainerProps
> = props => {
  const {children} = props;

  const providedState = SpacexService.useProvidedState();

  return (
    <SpacexService.Provider value={providedState}>
      {children}
    </SpacexService.Provider>
  );
};
