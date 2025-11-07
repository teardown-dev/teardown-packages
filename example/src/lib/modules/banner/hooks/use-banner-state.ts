import {NavigationService} from '../../../services/navigation.service.ts';
import {useEffect, useState} from 'react';

export const useBannerState = () => {
  const {navigationClient} = NavigationService.useState();

  const [bannerState, setBannerState] = useState(
    navigationClient.bannerService.getBannerInstruction(),
  );

  useEffect(() => {
    const bannerInstructionsListener =
      navigationClient.bannerService.emitter.on(
        'BANNER_STATE_CHANGED',
        ({payload: {state}}) => {
          setBannerState(state);
        },
      );

    return () => {
      bannerInstructionsListener.remove();
    };
  }, [navigationClient.bannerService.emitter]);

  return bannerState;
};
