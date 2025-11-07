import * as GeoJSON from 'geojson';
import * as turf from '@turf/turf';
import {Logger} from '../../logger';
import {DirectionsChangedEvent, RouteService} from '../../route';
import {
  UserLocation,
  UserLocationChangedEvent,
  UserLocationService,
} from '../../user-location';
import {Leg, Route} from '../../mapbox';
import {BaseEventEmitterEvent, EventEmitter, Events} from '../../event-emitter';
import {CameraService} from '../../camera';

export type Progress = {
  progress: number;
  path: GeoJSON.Feature<GeoJSON.LineString>;
  pathDistance: number;
  remainingPath: GeoJSON.Feature<GeoJSON.LineString>;
  remainingDistance: number;
};

export type NavigationState = {
  legIndex: number;
  leg: Leg;
  legProgress: Progress;
  stepIndex: number;
  step: Leg['steps'][number];
  stepProgress: Progress;
  isLastLeg: boolean;
  isLastStep: boolean;
  hasNextLeg: boolean;
  hasNextStep: boolean;
  shouldReRoute: boolean;
};

export type NavigationState2 = {
  distance: number;
  stepDistance: number;
  shouldReRoute: boolean;
};

export type NavigationStateChangedEvent = BaseEventEmitterEvent<
  'NAVIGATION_STATE_CHANGED',
  {
    state: NavigationState | null;
  }
>;

export type NavigationStateEvents = Events<{
  NAVIGATION_STATE_CHANGED: NavigationStateChangedEvent;
}>;

export class NavigationStateService {
  private logger: Logger;
  private userLocationService: UserLocationService;
  private route: RouteService;
  private cameraService: CameraService;

  private _navigationState: NavigationState | null = null;

  public emitter = new EventEmitter<NavigationStateEvents>();

  constructor(
    userLocation: UserLocationService,
    route: RouteService,
    cameraService: CameraService,
  ) {
    this.logger = new Logger('NavigationStateService');
    this.emitter = new EventEmitter<NavigationStateEvents>();
    this.userLocationService = userLocation;
    this.route = route;
    this.cameraService = cameraService;

    this.userLocationService.emitter.on(
      'USER_LOCATION_CHANGED',
      this.onUserLocationChanged.bind(this),
    );
    this.route.emitter.on(
      'DIRECTIONS_CHANGED',
      this.onDirectionsChanged.bind(this),
    );
    this.emitter.on(
      'NAVIGATION_STATE_CHANGED',
      this.onNavigationStateChanged.bind(this),
    );
  }

  private async onUserLocationChanged(_: UserLocationChangedEvent) {
    this.refreshNavigationState();
  }

  private async onDirectionsChanged(_: DirectionsChangedEvent) {
    this.resetNavigationState();
    this.refreshNavigationState();
  }

  private async onNavigationStateChanged(event: NavigationStateChangedEvent) {
    const {payload} = event;
    const {state} = payload;

    if (state == null) {
      return;
    }

    const {stepProgress} = state;

    this.cameraService.setCamera({
      centerCoordinate: [
        stepProgress.remainingPath.geometry.coordinates[0][0],
        stepProgress.remainingPath.geometry.coordinates[0][1],
      ],
      heading: turf.bearing(
        stepProgress.remainingPath.geometry.coordinates[0],
        stepProgress.remainingPath.geometry.coordinates[1],
      ),
    });
  }

  public getNavigationState() {
    return this._navigationState;
  }

  private setNavigationState(navigationState: NavigationState) {
    // this.logger.log('Setting navigation state', navigationState);
    this._navigationState = navigationState;
    this.emitter.emit('NAVIGATION_STATE_CHANGED', {
      state: navigationState,
    });
  }

  private resetNavigationState() {
    this._navigationState = null;
  }

  private userHasEnteredManeuverZone = false;
  private userBearingCompleteThreshold = 30 as const; // degrees
  private maxReRouteDistance = 50 as const; // 50 meters
  private maxSnapToLocation = 40 as const; // 40 meters
  private completionDistance = 75 as const; // 75 meters
  private shortCompletionDistance = 15 as const; // 15 meters
  public units = {
    units: 'meters',
  } as const;

  private refreshNavigationState() {
    try {
      const route = this.route.getNavigationRoute();
      if (route == null) {
        // this.logger.log(
        //   'No route found cannot generate initial navigation state',
        // );
        return;
      }

      const userLocation = this.userLocationService.getUserLocation();
      if (userLocation == null) {
        this.logger.log(
          'No user location found cannot generate initial navigation state',
        );
        return;
      }

      const currentNavigationState = this._navigationState;
      this.calculateNavigationState(
        route,
        userLocation,
        currentNavigationState?.legIndex ?? 0,
        currentNavigationState?.stepIndex ?? 0,
      );
    } catch (e) {
      console.log(e);
    }
  }

  private calculateNavigationState(
    route: Route<any>,
    userLocation: UserLocation,
    legIndex: number,
    stepIndex: number,
  ): NavigationState | null {
    const currentLeg = route.legs[legIndex];

    if (currentLeg == null) {
      this.logger.log('No current leg found cannot calculate navigation state');
      return null;
    }

    const currentStep = currentLeg.steps[stepIndex];

    // console.log('currentLeg', JSON.stringify(currentLeg, null, 2));
    // console.log('currentStep', JSON.stringify(currentStep, null, 2));

    if (currentStep == null) {
      // If we have reached the end of the steps in the current leg
      // then we should move to the next leg

      this.logger.log('####################### Leg completed', {
        legIndex,
        stepIndex,
      });

      return this.calculateNavigationState(
        route,
        userLocation,
        legIndex + 1,
        0,
      );
    }

    const legProgress = this.calculateLegProgress(userLocation, currentLeg);

    const stepProgress = this.calculateStepProgress(userLocation, currentStep);

    const modifiedCompletionDistance =
      stepProgress.remainingDistance < this.completionDistance
        ? this.shortCompletionDistance
        : this.completionDistance;

    if (stepProgress.remainingDistance <= modifiedCompletionDistance) {
      return this.calculateNavigationState(
        route,
        userLocation,
        legIndex,
        stepIndex + 1,
      );
    }

    const isLastLeg = legIndex === route.legs.length - 1;
    const isLastStep = stepIndex === currentLeg.steps.length - 1;

    const hasNextLeg = route.legs[legIndex + 1] != null;
    const hasNextStep = currentLeg.steps[stepIndex + 1] != null;

    const closestPointAlongLine =
      stepProgress.remainingPath.geometry.coordinates[0];

    // console.log('userLocation.coords', userLocation.coords);
    // console.log('closestPointAlongLine', closestPointAlongLine);

    // noinspection RedundantConditionalExpressionJS
    const shouldReRoute =
      turf.distance(
        [userLocation.longitude, userLocation.latitude],
        closestPointAlongLine,
        this.units,
      ) > this.maxReRouteDistance
        ? true
        : false;

    const navigationState: NavigationState = {
      legIndex,
      leg: currentLeg,
      legProgress,
      stepIndex,
      step: currentStep,
      stepProgress,
      isLastLeg,
      isLastStep,
      hasNextLeg,
      hasNextStep,
      shouldReRoute,
    };

    // this.logger.log('New navigation state generated', navigationState);
    this.setNavigationState(navigationState);
    return navigationState;
  }

  private calculateLegProgress(userLocation: UserLocation, currentLeg: Leg) {
    const legRoute = turf.lineString(
      currentLeg.steps.reduce((acc, step) => {
        if (step.geometry.type !== 'LineString') {
          return acc;
        }

        return acc.concat(step.geometry.coordinates);
      }, [] as GeoJSON.Position[]),
    );

    const progress = this.calculateProgress(legRoute, userLocation);

    return {
      ...progress,
    };
  }

  private calculateStepProgress(
    userLocation: UserLocation,
    currentStep: Leg['steps'][number],
  ) {
    const progress = this.calculateProgress(
      turf.feature(currentStep.geometry),
      userLocation,
    );

    return {
      ...progress,
    };
  }

  private calculateProgress(
    path: GeoJSON.Feature<GeoJSON.LineString>,
    userLocation: UserLocation,
  ): Progress {
    const userPoint = turf.point([
      userLocation.longitude,
      userLocation.latitude,
    ]);

    const pathDistance = turf.length(path, this.units);

    const remainingPath = this.getRemainingPath(path, userPoint);

    const remainingDistance =
      remainingPath == null ? 0 : turf.length(remainingPath, this.units);

    const progress = (pathDistance - remainingDistance) / pathDistance;

    // const isCompleted = progress >= 1;

    return {
      progress,
      path,
      pathDistance,
      remainingDistance,
      remainingPath,
    };
  }

  private getRemainingPath(
    fullPath: GeoJSON.Feature<GeoJSON.LineString>,
    userLocation: GeoJSON.Feature<GeoJSON.Point>,
  ) {
    const segmentEndPoint = turf.point(
      fullPath.geometry.coordinates[fullPath.geometry.coordinates.length - 1],
    );

    return turf.lineSlice(userLocation, segmentEndPoint, fullPath);
  }
}
