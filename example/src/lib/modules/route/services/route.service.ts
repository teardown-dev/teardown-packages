import {CameraService} from '../../camera';
import {Directions, MapboxService, Route} from '../../mapbox';
import {Logger} from '../../logger';
import * as GeoJSON from 'geojson';
import {BaseEventEmitterEvent, EventEmitter} from '../../event-emitter';
import {
  UserLocationChangedEvent,
  UserLocationService,
} from '../../user-location';

export type WaypointsChangedEvent = BaseEventEmitterEvent<
  'WAYPOINTS_CHANGED',
  {
    waypoints: GeoJSON.Position[];
  }
>;

export type DirectionsChangedEvent = BaseEventEmitterEvent<
  'DIRECTIONS_CHANGED',
  {
    directions: Directions;
  }
>;

export type RouteGenerationError = {
  code: 'GENERIC_ERROR' | 'NO_ROUTE_FOUND' | 'NO_WAYPOINTS_PROVIDED';
  message: string;
};

export type RouteGenerationErrorEvent = BaseEventEmitterEvent<
  'ROUTE_GENERATION_ERROR',
  {
    error: RouteGenerationError;
  }
>;

export type RouteChangedEvent = BaseEventEmitterEvent<
  'ROUTE_CHANGED',
  {
    route: Route<GeoJSON.LineString> | null;
  }
>;

export type RouteServiceEvents = {
  WAYPOINTS_CHANGED: WaypointsChangedEvent;
  DIRECTIONS_CHANGED: DirectionsChangedEvent;
  ROUTE_CHANGED: RouteChangedEvent;
  ROUTE_GENERATION_ERROR: RouteGenerationErrorEvent;
};

/*
 *   RouteService
 *   This service is responsible for managing the route between waypoints
 *   It listens for changes in waypoints and generates directions.
 *   It also listens for changes in user location and updates and generates a route if needed.
 * */
export class RouteService {
  private logger: Logger;
  private mapbox: MapboxService;
  private userLocation: UserLocationService;
  private camera: CameraService;

  public emitter: EventEmitter<RouteServiceEvents>;

  private _waypoints: GeoJSON.Position[] | null = null;
  private _directions: Directions | null = null;
  private _route: Route<GeoJSON.LineString> | null = null;
  private generatingDirectionsLock: boolean = false;
  private generatingDirectionsError: RouteGenerationError | null = null;

  constructor(
    mapbox: MapboxService,
    userLocation: UserLocationService,
    camera: CameraService,
  ) {
    this.logger = new Logger('RouteService');
    this.mapbox = mapbox;
    this.userLocation = userLocation;
    this.camera = camera;

    this.emitter = new EventEmitter<RouteServiceEvents>();

    this.emitter.on('WAYPOINTS_CHANGED', event =>
      this.onWaypointsChanged(event),
    );

    this.emitter.on('DIRECTIONS_CHANGED', event =>
      this.onDirectionsChanged(event),
    );

    this.userLocation.emitter.on('USER_LOCATION_CHANGED', event =>
      this.onUserLocationChanged(event),
    );

    // this.blackbox.emitter.on('NAVIGATION_ROUTE_CHANGED', event =>
    //   this.onNavigationRouteChanged(event),
    // );
    //
    // this.blackbox.emitter.on('NAVIGATION_STATE_CHANGED', event =>
    //   this.onNavigationStateChanged(event),
    // );
    //
    // this.blackbox.emitter.on('NAVIGATION_PROGRESS_CHANGED', event =>
    //   this.onNavigationProgressChanged(event),
    // );
    //
  }

  public getWaypoints(): GeoJSON.Position[] {
    return this._waypoints ?? [];
  }

  public setWaypoints(waypoints: GeoJSON.Position[]) {
    this.logger.log('setWaypoints', waypoints);
    this._waypoints = waypoints;
    this.emitter.emit('WAYPOINTS_CHANGED', {
      waypoints,
    });
  }

  public getDirections(): Directions | null {
    return this._directions;
  }

  public setDirections(directions: Directions) {
    this._directions = directions;
    this.emitter.emit('DIRECTIONS_CHANGED', {
      directions,
    });
  }

  public getRoute(): Route<GeoJSON.LineString> | null {
    return this._route;
  }

  public setRoute(route: Route<GeoJSON.LineString> | null) {
    this._route = route;
    this.emitter.emit('ROUTE_CHANGED', {
      route,
    });
  }

  public getNavigationRoute() {
    // TODO give ability to select route - atm we just select the first one
    if (this._directions?.routes[0] == null) {
      return null;
    }

    return this._directions?.routes[0];
  }

  private async onWaypointsChanged(event: WaypointsChangedEvent) {
    this.logger.log('onWaypointsChanged', event);
    // const {
    //   payload: {waypoints},
    // } = event;

    // When ever the waypoints change, we need to generate new directions
    await this.generateDirections();
  }

  private async onDirectionsChanged(event: DirectionsChangedEvent) {
    const {
      payload: {directions},
    } = event;
    // this.logger.log('onDirectionsChanged', event);

    const firstRoute = directions.routes[0];
    if (firstRoute == null) {
      this.onRouteGenerationError({
        code: 'NO_ROUTE_FOUND',
        message: 'No route found',
      });
      return;
    }

    this.setRoute(firstRoute);
  }

  onRouteGenerationError(error: RouteGenerationError) {
    this.logger.error('Route generation failed', error);
    this.generatingDirectionsError = error;
    this.generatingDirectionsLock = false;
    this.emitter.emit('ROUTE_GENERATION_ERROR', {
      error,
    });
  }

  public async generateDirections() {
    if (this.generatingDirectionsLock) {
      this.logger.log('Already generating directions - skipping');
      return;
    }

    if (this.generatingDirectionsError != null) {
      this.logger.info(
        'Previous directions generation failed - not trying again',
        {
          generatingDirectionsError: this.generatingDirectionsError,
        },
      );
      return;
    }
    this.logger.log('Generating initial directions');

    const userLocation = this.userLocation.getUserLocation();
    if (userLocation == null) {
      this.logger.log('User location not found cannot generate directions');
      return;
    }
    this.logger.log('User location found', userLocation);

    const waypoints = this._waypoints;

    if (waypoints == null || waypoints.length === 0) {
      this.onRouteGenerationError({
        code: 'NO_WAYPOINTS_PROVIDED',
        message:
          'No waypoints provided - provide at least one waypoint to generate directions',
      });
      return;
    }

    this.generatingDirectionsLock = true;

    const routeWaypoints = [
      [userLocation.longitude, userLocation.latitude],
      ...waypoints,
    ];

    try {
      this.logger.log('Generating route', routeWaypoints);
      const directions = await this.mapbox.getRoute(routeWaypoints, {
        steps: true,
        bannerInstructions: true,
        voiceInstructions: true,
        voiceUnits: 'metric', // TODO - get from settings / options
      });

      this.logger.log('Generated directions', directions);

      this.setDirections(directions);
    } catch (error: any) {
      this.onRouteGenerationError({
        code: 'GENERIC_ERROR',
        message:
          'message' in error ? error.message : 'Failed to generate route',
      });
    }

    this.generatingDirectionsLock = false;
  }

  async onUserLocationChanged(event: UserLocationChangedEvent) {
    // this.logger.log('onUserLocationChanged', event);
    // const {
    //   payload: {location},
    // } = event;

    if (this._directions == null) {
      await this.generateDirections();
    }

    // TODO move to navigation service
    // const navigationState = this.blackbox.getNavigationState();
    //
    // if (navigationState == null) {
    //   return;
    // }
    //
    // const navigationRoute = this.blackbox.getNavigationRoute();
    //
    // if (navigationRoute == null) {
    //   return;
    // }
    //
    // try {
    //   const newNavigationState = this.refreshNavigationState(
    //       navigationRoute,
    //       navigationState.legIndex,
    //       navigationState.stepIndex,
    //       turf.point([location.coords.longitude, location.coords.latitude])
    //           .geometry,
    //       location.coords.heading,
    //   );
    //
    //   this.logger.log('navigationState', navigationState);
    //   this.logger.log('newNavigationState', newNavigationState);
    //
    //   this.blackbox.setNavigationState(newNavigationState);
    // } catch (error) {
    //   this.logger.error('error', error);
    // }
  }

  //
  // async onNavigationRouteChanged(event: NavigationRouteChangedEvent) {
  //   this.logger.log('onNavigationRouteChanged', event);
  //   const {
  //     payload: {navigationRoute},
  //   } = event;
  //
  //   if (this.blackbox.getNavigationState() == null) {
  //     const snapToLocation = turf.point(
  //       (navigationRoute.legs[0].steps[0].geometry as GeoJSON.LineString)
  //         .coordinates[0],
  //     );
  //
  //     this.logger.log('Setting initial navigation state', {snapToLocation});
  //     // this.blackbox.setNavigationState({
  //     //   legIndex: 0,
  //     //   stepIndex: 0,
  //     //   snapToLocation: snapToLocation.geometry,
  //     //   stepDistance: 0,
  //     //   userDistanceToEndStep: 0,
  //     //   absoluteDistance: 0,
  //     //   shouldReRoute: false,
  //     // });
  //   }
  // }
  // onNavigationStateChanged(event: NavigationStateChangedEvent) {
  //   const {
  //     payload: {state},
  //   } = event;
  //   // this.logger.log("onNavigationStateChanged", state);
  //
  //   // if (this.blackbox.getNavigationProgress() == null) {
  //   //   this.generateNavigationProgressUpdate();
  //   // }
  //
  //   // this.camera.ref.current?.setCamera({
  //   //   centerCoordinate: state.snapToLocation.coordinates,
  //   //   animationDuration: 350,
  //   // });
  // }
  //
  // onNavigationProgressChanged(event: NavigationProgressChangedEvent) {
  //   this.logger.log('onNavigationProgressChanged', event);
  //   const {
  //     payload: {progress},
  //   } = event;
  //
  //   // const { bannerInstruction, voiceInstruction } = navigationAction;
  //   //
  //   // if (voiceInstruction != null) {
  //   //   Speech.speak(voiceInstruction?.announcement);
  //   // }
  //
  //   // this is only needed to be implemented if we want to show duration and how far along the route the user is
  // }
  //

  //
  // private userHasEnteredManeuverZone = false;
  // private userBearingCompleteThreshold = 30 as const; // degrees
  // private maxReRouteDistance = 50 as const; // 50 meters
  // private maxSnapToLocation = 40 as const; // 40 meters
  // private completionDistance = 75 as const; // 75 meters
  // private shortCompletionDistance = 15 as const; // 15 meters
  //
  // private refreshNavigationState(
  //   navigationRoute: Route<GeoJSON.LineString>,
  //   currentLegIndex: number,
  //   currentStepIndex: number,
  //   userLocation: GeoJSON.Point,
  //   userBearing?: number,
  // ): NavigationState {
  //   this.logger.log('Refreshing navigation state');
  //
  //
  //   const segmentSlicedToUser = turf.lineSlice(
  //     userLocation,
  //     segmentEndPoint,
  //     currentStepRoute,
  //   );
  //
  //   const userDistanceToEndStepInKm = turf.length(segmentSlicedToUser, {
  //     units: 'meters',
  //   });
  //   const userDistanceToEndStep = userDistanceToEndStepInKm * 1000; // meters
  //
  //   const userAbsoluteDistanceInKm = turf.distance(
  //     userLocation,
  //     segmentEndPoint,
  //     {
  //       units: 'meters',
  //     },
  //   );
  //   const userAbsoluteDistance = userAbsoluteDistanceInKm * 1000; // meters
  //
  //   //
  //   // Check if user has completed step. Two factors:
  //   //   1. Are they within a certain threshold of the end of the step?
  //   //   2. If a bearing is provided, is their bearing within a current threshold of the exit bearing for the step
  //   //

  //
  //   // If the step distance is less than options.completionDistance, modify it and make it 10 ft

  //   // Do not increment userCurrentStep if the user is approaching the final step
  //
  //   this.logger.log('stepDistance', stepDistance);
  //   this.logger.log('stepDistanceInKm', stepDistanceInKm);
  //   this.logger.log('userDistanceToEndStepInKm', userDistanceToEndStepInKm);
  //   this.logger.log('userDistanceToEndStep', userDistanceToEndStep);
  //   this.logger.log('userDistanceToEndStep', userDistanceToEndStep);
  //   this.logger.log('modifiedCompletionDistance', modifiedCompletionDistance);
  //   this.logger.log('userAbsoluteDistance', userAbsoluteDistance);
  //   this.logger.log('withinBearingThreshold', withinBearingThreshold);
  //
  //   let stepIndex: number;
  //
  //   this.logger.log('currentStepIndex', currentStepIndex);
  //   this.logger.log('currentLeg.steps.length', currentLeg.steps.length);
  //

  //
  //   const absoluteDistance = userAbsoluteDistance;
  //
  //   const distanceFromClosestPointInKm = turf.distance(
  //     userLocation,
  //     closestPoint,
  //     {
  //       units: 'kilometers',
  //     },
  //   );
  //   const distanceFromClosestPoint = distanceFromClosestPointInKm * 1000;
  //   const shouldReRoute = distanceFromClosestPoint >= this.maxReRouteDistance;
  //
  //   const newState: NavigationState = {
  //     legIndex,
  //     stepIndex,
  //     snapToLocation,
  //     stepDistance,
  //     userDistanceToEndStep,
  //     absoluteDistance,
  //     shouldReRoute,
  //
  //     // new values
  //     distanceFromClosestPoint,
  //     distanceFromClosestPointInKm,
  //     userLocation,
  //     userBearing: userBearing ?? 0,
  //     distanceInKm,
  //     distance,
  //     segmentRoute: currentStepRoute,
  //     closestPoint,
  //     segmentEndPoint,
  //     segmentSlicedToUser,
  //     userDistanceToEndStepInKm,
  //     userAbsoluteDistanceInKm,
  //     modifiedCompletionDistance,
  //     withinBearingThreshold,
  //   };
  //
  //   // this.logger.log('newState', newState);
  //
  //   return newState;
  // }

  finishNavigation() {}

  // private rerouting: boolean = false;
  // reroute() {
  //   if (this.rerouting) {
  //     return;
  //   }
  //
  //   this.rerouting = true;
  // }
}
