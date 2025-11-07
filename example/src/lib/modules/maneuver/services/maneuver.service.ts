import {
  NavigationStateChangedEvent,
  NavigationStateService,
} from '../../navigation';
import {CameraLockChangedEvent, CameraService} from '../../camera';
import {Maneuver} from '../../mapbox';
import {BaseEventEmitterEvent, EventEmitter, Events} from '../../event-emitter';
import {Logger} from '../../logger';
import {
  UserLocationChangedEvent,
  UserLocationService,
} from '../../user-location';
import {RouteService} from '../../route';
import * as turf from '@turf/turf';

export type ManeuverState = Maneuver & {
  legIndex: number;
  stepIndex: number;
  hasEntered: boolean;
};

export type ManeuverStateChangedEvent = BaseEventEmitterEvent<
  'MANEUVER_STATE_CHANGED',
  {
    state: ManeuverState | null;
  }
>;

export type ManeuverEvents = Events<{
  MANEUVER_STATE_CHANGED: ManeuverStateChangedEvent;
}>;

export class ManeuverService {
  private logger: Logger;
  private navigationStateService: NavigationStateService;
  private cameraService: CameraService;
  private routeService: RouteService;
  private userLocation: UserLocationService;

  private _state: ManeuverState | null = null;

  emitter: EventEmitter<ManeuverEvents>;

  constructor(
    navigationStateService: NavigationStateService,
    cameraService: CameraService,
    routeService: RouteService,
    userLocation: UserLocationService,
  ) {
    this.logger = new Logger('ManeuverService');
    this.navigationStateService = navigationStateService;
    this.cameraService = cameraService;
    this.routeService = routeService;
    this.userLocation = userLocation;

    this.emitter = new EventEmitter<ManeuverEvents>();

    this.emitter.on(
      'MANEUVER_STATE_CHANGED',
      this.onManeuverStateChanged.bind(this),
    );

    // this.navigationStateService.emitter.on(
    //   'NAVIGATION_STATE_CHANGED',
    //   this.onNavigationStateChange.bind(this),
    // );

    this.cameraService.emitter.on(
      'CAMERA_LOCK_CHANGED',
      this.onCameraLockChanged.bind(this),
    );

    this.routeService.emitter.on(
      'ROUTE_CHANGED',
      this.onRouteChanged.bind(this),
    );

    this.userLocation.emitter.on(
      'USER_LOCATION_CHANGED',
      this.onUserLocationChanged.bind(this),
    );
  }

  private setManeuverState(state: ManeuverState | null) {
    this._state = state;
    this.emitter.emit('MANEUVER_STATE_CHANGED', {
      state,
    });
  }

  private updateManeuverState(state: Partial<ManeuverState>) {
    if (this._state == null) {
      return;
    }

    this.setManeuverState({
      ...this._state,
      ...state,
    });
  }

  public getManeuverState() {
    return this._state;
  }

  private onRouteChanged() {
    const route = this.routeService.getNavigationRoute();

    if (route == null) {
      return;
    }

    if (this._state == null) {
      this.setupFirstManeuver();
      return;
    }
  }

  private setupFirstManeuver() {
    const route = this.routeService.getNavigationRoute();

    if (route == null) {
      return;
    }

    const firstManeuver = route.legs[0].steps[0].maneuver;

    if (firstManeuver == null) {
      return null;
    }

    const {hasEnteredManeuver} = this.getManeuverInfo(firstManeuver);

    this.cameraService.setCamera({
      heading: firstManeuver.bearing_after,
      centerCoordinate: firstManeuver.location,
    });

    this.setManeuverState({
      ...firstManeuver,
      legIndex: 0,
      stepIndex: 0,
      hasEntered: hasEnteredManeuver,
    });
  }

  private onManeuverStateChanged(event: ManeuverStateChangedEvent) {
    const {
      payload: {state},
    } = event;

    this.logger.log('Maneuver state changed', state);

    if (state == null) {
      return;
    }

    if (state.hasEntered) {
      this.onManeuverEntered(state);
      return;
    }

    // const distanceFromManeuver = turf.distance(
    //   userLocation.coords,
    //   maneuver.location,
    //   this.navigationStateService.units,
    // );
  }

  private onManeuverEntered(state: ManeuverState) {
    this.logger.log('Maneuver entered', state);
    // this.cameraService.setCamera({
    //   animationDuration: 500,
    //   animationMode: 'none',
    //   heading: state.bearing_after,
    //   centerCoordinate: state.location,
    //   zoomLevel: 16,
    //   pitch: 35,
    // });
  }

  onNavigationStateChange(event: NavigationStateChangedEvent) {
    const navigationState = event.payload.state;

    if (navigationState == null) {
      return;
    }

    // const {maneuver} = navigationState;
    //
    // this.setManeuverState(maneuver);

    // this.cameraService.setCamera({
    //   type: 'CameraStops',
    //   stops: [
    //     {
    //       animationDuration: 0,
    //       animationMode: 'none',
    //       heading: this._maneuver?.bearing_before,
    //       centerCoordinate: userLocation.coords,
    //       zoomLevel: 16,
    //     },
    //     {
    //       animationDuration: 1000,
    //       animationMode: 'easeTo',
    //       heading: this._maneuver?.bearing_after,
    //       centerCoordinate: userLocation.coords,
    //       zoomLevel: 16,
    //     },
    //   ],
    // });
  }

  onCameraLockChanged(event: CameraLockChangedEvent) {
    const {isLocked} = event.payload;

    if (!isLocked) {
      return;
    }

    const maneuver = this._state;

    if (maneuver == null) {
      return;
    }

    const userLocation = this.userLocation.getUserLocation();

    if (userLocation == null) {
      return;
    }

    const navigationState = this.navigationStateService.getNavigationState();

    if (navigationState == null) {
      return;
    }

    const fistPoint =
      navigationState.stepProgress.remainingPath.geometry.coordinates[0];

    this.cameraService.setCamera({
      heading: this._state?.bearing_after,
      centerCoordinate: fistPoint,
    });
  }

  onUserLocationChanged(event: UserLocationChangedEvent) {
    const {location} = event.payload;

    if (location == null) {
      return;
    }

    if (this._state == null) {
      return;
    }

    const {hasEnteredManeuver, hasExitedManeuver} = this.getManeuverInfo(
      this._state,
    );

    if (hasEnteredManeuver && !this._state.hasEntered) {
      this.updateManeuverState({
        hasEntered: true,
      });
    } else if (hasExitedManeuver && this._state.hasEntered) {
      const nextManeuver = this.getNextManeuver();

      if (nextManeuver == null) {
        this.setManeuverState(null);
      } else {
        this.setManeuverState({
          ...nextManeuver,
          hasEntered: false,
        });
      }
    } else {
      console.log(
        'User has not entered or exited maneuver should we reroute here?',
      );
    }
  }

  getNextManeuver() {
    const route = this.routeService.getNavigationRoute();

    if (this._state == null || route == null) {
      return null;
    }

    const {legIndex, stepIndex} = this._state;

    const nextStep = route.legs[legIndex].steps[stepIndex + 1];

    if (nextStep != null) {
      return {
        ...nextStep.maneuver,
        legIndex,
        stepIndex: stepIndex + 1,
      };
    }

    const nextLeg = route.legs[legIndex + 1];

    if (nextLeg == null) {
      return null;
    }

    const nextStepInNextLeg = nextLeg.steps[0];

    if (nextStepInNextLeg == null) {
      return null;
    }

    return {
      ...nextStepInNextLeg.maneuver,
      legIndex: legIndex + 1,
      stepIndex: 0,
    };
  }

  getManeuverInfo(state: Maneuver) {
    const distanceToManeuver = this.distanceToManeuver(state);

    const hasEnteredManeuver =
      distanceToManeuver != null && distanceToManeuver < 50;
    const hasExitedManeuver =
      distanceToManeuver != null && distanceToManeuver > 50;

    return {
      distanceToManeuver,
      hasEnteredManeuver,
      hasExitedManeuver,
    };
  }

  distanceToManeuver(state: Maneuver) {
    const userLocation = this.userLocation.getUserLocation();

    if (userLocation == null) {
      return null;
    }

    if (this._state == null) {
      return null;
    }

    const userLocationPoint = turf.point([
      userLocation.longitude,
      userLocation.latitude,
    ]);
    const maneuverPoint = turf.point(state.location);
    return turf.distance(
      userLocationPoint,
      maneuverPoint,
      this.navigationStateService.units,
    );
  }
}
