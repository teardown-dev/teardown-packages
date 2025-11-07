import {
  NavigationStateChangedEvent,
  NavigationStateService,
  Progress,
} from '../../navigation';
import {BaseEventEmitterEvent, EventEmitter, Events} from '../../event-emitter';
import {BannerInstruction, Step} from '../../mapbox';
import {UserLocationService} from '../../user-location';
import {ReactNode} from 'react';
import {BannerInstructionsService} from './banner-instructions.service.tsx';
import {Logger} from '../../logger';
import {CameraService} from '../../camera';

export type BannerInstructionsAlongGeometry = {
  [key: number]: BannerInstruction;
};

export type BannerState = {
  bannerInstruction: BannerInstruction;
  icon: ReactNode;
};

export type BannerStateChangedEvent = BaseEventEmitterEvent<
  'BANNER_STATE_CHANGED',
  {
    state: BannerState | null;
  }
>;

export type BannerEvents = Events<{
  BANNER_STATE_CHANGED: BannerStateChangedEvent;
}>;

export class BannerService {
  private logger: Logger;
  private navigationStateService: NavigationStateService;
  private userLocationService: UserLocationService;
  private bannerInstructionsService: BannerInstructionsService;
  private cameraService: CameraService;

  emitter = new EventEmitter<BannerEvents>();

  private _bannerState: BannerState | null = null;

  constructor(
    navigationStateService: NavigationStateService,
    userLocationService: UserLocationService,
    cameraService: CameraService,
  ) {
    this.logger = new Logger('BannerService');
    this.navigationStateService = navigationStateService;
    this.userLocationService = userLocationService;
    this.cameraService = cameraService;
    this.bannerInstructionsService = new BannerInstructionsService();

    this.emitter = new EventEmitter<BannerEvents>();

    this.navigationStateService.emitter.on(
      'NAVIGATION_STATE_CHANGED',
      this.onNavigationStateChange.bind(this),
    );

    this.emitter.on(
      'BANNER_STATE_CHANGED',
      this.onBannerStateChanged.bind(this),
    );
  }

  private onBannerStateChanged(event: BannerStateChangedEvent) {
    // this.logger.log('onBannerStateChanged', event.payload.state);


    if (event.payload.state == null) {
      return;
    }

    const {bannerInstruction} = event.payload.state;
  }

  private setBannerState(bannerState: BannerState | null) {
    if (bannerState == null && this._bannerState == null) {
      return;
    }

    if (bannerState != null) {
      const previousBannerInstruction = this._bannerState?.bannerInstruction;
      const nextBannerInstruction = bannerState.bannerInstruction;

      const previousDistance = previousBannerInstruction?.distanceAlongGeometry;
      const nextDistance = nextBannerInstruction.distanceAlongGeometry;

      if (
        previousDistance != null &&
        nextDistance != null &&
        previousDistance === nextDistance
      ) {
        return;
      }
    }

    this._bannerState = bannerState;
    this.emitter.emit('BANNER_STATE_CHANGED', {
      state: bannerState,
    });
  }

  getBannerInstruction() {
    return this._bannerState;
  }

  private onNavigationStateChange(event: NavigationStateChangedEvent) {
    const navigationState = event.payload.state;

    if (navigationState == null) {
      return;
    }

    const {step} = navigationState;

    const bannerInstruction = this.findNextBannerInstruction(
      step,
      navigationState.stepProgress,
    );

    if (bannerInstruction == null) {
      this.setBannerState(null);
      return;
    }

    const icon =
      this.bannerInstructionsService.getIconForBannerInstruction(
        bannerInstruction,
      );

    const state: BannerState = {
      bannerInstruction,
      icon,
    };

    this.setBannerState(state);
  }

  private onUserLocationChange() {
    // const navigationState = this.navigationStateService.getNavigationState();
    // if (navigationState == null) {
    //   return;
    // }
    //
    // const {step} = navigationState;
  }

  private getBannerInstructionsAlongGeometry(
    step: Step,
  ): BannerInstructionsAlongGeometry {
    return step.bannerInstructions.reduce((acc, instruction) => {
      return {
        ...acc,
        [instruction.distanceAlongGeometry]: instruction,
      };
    }, {} as BannerInstructionsAlongGeometry);
  }

  private findNextBannerInstruction(
    step: Step,
    progress: Progress,
  ): BannerInstruction | null {
    const distanceAlongGeometry = this.getBannerInstructionsAlongGeometry(step);

    const keys = Object.keys(
      distanceAlongGeometry,
    ).sort() as unknown as number[];

    const nextInstruction = keys.find(key => key >= progress.remainingDistance);

    if (nextInstruction == null) {
      return null;
    }

    const bannerInstruction = distanceAlongGeometry[nextInstruction];

    if (bannerInstruction == null) {
      return null;
    }

    if (bannerInstruction.primary.type === 'arrive') {
      // TODO: We could be arriving at a waypoint so just ignore this for now. But we could also be arriving at a destination so we should handle this.
      return null;
    }

    return bannerInstruction;
  }
}
