import {
  BannerInstruction,
  Leg,
  Route,
  Step,
  VoiceInstruction,
} from '@mapbox/mapbox-sdk/services/directions';
import * as turf from '@turf/turf';

import {NavigationBlackbox} from './blackbox';
import {
  DirectionsChangedEvent,
  NavigationProgressChangedEvent,
  NavigationRouteChangedEvent,
  NavigationState,
  NavigationStateChangedEvent,
  UserLocationChangedEvent,
  WaypointsChangedEvent,
} from './blackbox/event.types';
import {CameraService} from './camera.service';
import {MapboxService} from './mapbox.service';

export class RouteService {
  private mapbox: MapboxService;
  private blackbox: NavigationBlackbox;
  private camera: CameraService;

  constructor(
    mapbox: MapboxService,
    blackbox: NavigationBlackbox,
    camera: CameraService,
  ) {
    this.mapbox = mapbox;
    this.blackbox = blackbox;
    this.camera = camera;

    this.blackbox.emitter.on('WAYPOINTS_CHANGED', event =>
      this.onWaypointsChanged(event),
    );

    this.blackbox.emitter.on('DIRECTIONS_CHANGED', event =>
      this.onDirectionChanged(event),
    );

    this.blackbox.emitter.on('NAVIGATION_ROUTE_CHANGED', event =>
      this.onNavigationRouteChanged(event),
    );

    this.blackbox.emitter.on('NAVIGATION_STATE_CHANGED', event =>
      this.onNavigationStateChanged(event),
    );

    this.blackbox.emitter.on('NAVIGATION_PROGRESS_CHANGED', event =>
      this.onNavigationProgressChanged(event),
    );

    this.blackbox.emitter.on('USER_LOCATION_CHANGED', event =>
      this.onUserLocationChanged(event),
    );
  }
  async onWaypointsChanged(event: WaypointsChangedEvent) {
    console.log('onWaypointsChanged', event);
    const {
      payload: {waypoints},
    } = event;
  }

  onDirectionChanged(event: DirectionsChangedEvent) {
    console.log('onDirectionChanged', event);
    const {
      payload: {directions},
    } = event;

    if (this.blackbox.getNavigationRoute() == null) {
      const route = directions.routes[0];
      this.blackbox.setNavigationRoute(route);
    }
  }

  async onNavigationRouteChanged(event: NavigationRouteChangedEvent) {
    console.log('onNavigationRouteChanged', event);
    const {
      payload: {navigationRoute},
    } = event;

    if (this.blackbox.getNavigationState() == null) {
      const snapToLocation = turf.point(
        (navigationRoute.legs[0].steps[0].geometry as GeoJSON.LineString)
          .coordinates[0],
      );

      console.log('Setting initial navigation state', {snapToLocation});
      this.blackbox.setNavigationState({
        legIndex: 0,
        stepIndex: 0,
        snapToLocation: snapToLocation.geometry,
        stepDistance: 0,
        userDistanceToEndStep: 0,
        absoluteDistance: 0,
        shouldReRoute: false,
      });
    }
  }
  onNavigationStateChanged(event: NavigationStateChangedEvent) {
    const {
      payload: {state},
    } = event;
    // console.log("onNavigationStateChanged", state);

    // if (this.blackbox.getNavigationProgress() == null) {
    //   this.generateNavigationProgressUpdate();
    // }

    // this.camera.ref.current?.setCamera({
    //   centerCoordinate: state.snapToLocation.coordinates,
    //   animationDuration: 350,
    // });
  }

  onNavigationProgressChanged(event: NavigationProgressChangedEvent) {
    console.log('onNavigationProgressChanged', event);
    const {
      payload: {progress},
    } = event;

    // const { bannerInstruction, voiceInstruction } = navigationAction;
    //
    // if (voiceInstruction != null) {
    //   Speech.speak(voiceInstruction?.announcement);
    // }

    // this is only needed to be implemented if we want to show duration and how far along the route the user is
  }

  async onUserLocationChanged(event: UserLocationChangedEvent) {
    // console.log('onUserLocationChanged', event);
    const {
      payload: {location},
    } = event;

    if (this.blackbox.getDirections() == null) {
      // directions not found and need to be generated
      await this.generateInitialDirections();
    }

    const navigationState = this.blackbox.getNavigationState();

    if (navigationState == null) {
      return;
    }

    const navigationRoute = this.blackbox.getNavigationRoute();

    if (navigationRoute == null) {
      return;
    }

    try {
      const newNavigationState = this.refreshNavigationState(
        navigationRoute,
        navigationState.legIndex,
        navigationState.stepIndex,
        turf.point([location.coords.longitude, location.coords.latitude])
          .geometry,
        location.coords.heading,
      );

      console.log('navigationState', navigationState);
      console.log('newNavigationState', newNavigationState);

      this.blackbox.setNavigationState(newNavigationState);
    } catch (error) {
      console.error('error', error);
    }
  }

  private generatingDirections: boolean = false;
  private generatingDirectionsFailed: boolean = false;

  private async generateInitialDirections() {
    console.log('generateInitialDirections');
    if (this.generatingDirections || this.generatingDirectionsFailed) {
      return null;
    }

    const userLocation = this.blackbox.getUserLocation();

    if (!userLocation) {
      return null;
    }

    this.generatingDirections = true;

    const waypoints = this.blackbox.getWaypoints();

    const routeWaypoints = [[...userLocation.coords].reverse(), ...waypoints];

    try {
      const directions = await this.mapbox.getRoute(routeWaypoints, {
        steps: true,
        bannerInstructions: true,
        voiceInstructions: true,
        voiceUnits: 'metric',
      });

      console.log('directions', directions);

      this.blackbox.setDirections(directions);
    } catch (error) {
      this.generatingDirectionsFailed = true;
      console.error('errrr', error);
    }

    this.generatingDirections = false;
  }

  private userHasEnteredManeuverZone = false;
  private userBearingCompleteThreshold = 30 as const; // degrees
  private maxReRouteDistance = 50 as const; // 50 meters
  private maxSnapToLocation = 40 as const; // 40 meters
  private completionDistance = 75 as const; // 75 meters
  private shortCompletionDistance = 15 as const; // 15 meters

  private calculateDistanceFromClosestPoint(
    userLocation: GeoJSON.Point,
    closestPoint: GeoJSON.Point,
  ) {
    const distanceFromClosestPointInKm = turf.distance(
      userLocation,
      closestPoint,
      {
        units: 'kilometers',
      },
    );
    const distanceFromClosestPoint = distanceFromClosestPointInKm * 1000;

    return distanceFromClosestPoint;
  }

  private refreshNavigationState(
    navigationRoute: Route<GeoJSON.LineString>,
    currentLegIndex: number,
    currentStepIndex: number,
    userLocation: GeoJSON.Point,
    userBearing?: number,
  ): NavigationState {
    console.log('Refreshing navigation state');

    const legIndex = currentLegIndex;
    const currentLeg = navigationRoute.legs[currentLegIndex];

    const stepCoordinates = currentLeg.steps[currentStepIndex].geometry
      .coordinates as GeoJSON.Position[];

    console.log('stepCoordinates', stepCoordinates);

    const currentStepRoute = turf.lineString(stepCoordinates);
    const closestPoint = turf.nearestPointOnLine(
      currentStepRoute,
      userLocation,
    );

    const distanceInKm = turf.distance(userLocation, closestPoint, {
      units: 'kilometers',
    });
    const distance = distanceInKm * 1000;

    const segmentEndPoint = turf.point(
      stepCoordinates[stepCoordinates.length - 1],
    );

    const segmentSlicedToUser = turf.lineSlice(
      userLocation,
      segmentEndPoint,
      currentStepRoute,
    );

    const userDistanceToEndStepInKm = turf.length(segmentSlicedToUser, {
      units: 'meters',
    });
    const userDistanceToEndStep = userDistanceToEndStepInKm * 1000; // meters

    const userAbsoluteDistanceInKm = turf.distance(
      userLocation,
      segmentEndPoint,
      {
        units: 'meters',
      },
    );
    const userAbsoluteDistance = userAbsoluteDistanceInKm * 1000; // meters


    //
    // Check if user has completed step. Two factors:
    //   1. Are they within a certain threshold of the end of the step?
    //   2. If a bearing is provided, is their bearing within a current threshold of the exit bearing for the step
    //
    const stepDistanceInKm = turf.length(currentStepRoute, {
      units: 'kilometers',
    });

    const stepDistance = stepDistanceInKm * 1000; // meters

    // If the step distance is less than options.completionDistance, modify it and make it 10 ft
    const modifiedCompletionDistance =
      stepDistance < this.completionDistance
        ? this.shortCompletionDistance
        : this.completionDistance;
    // Check if users bearing is within threshold of the steps exit bearing
    const withinBearingThreshold =
      userBearing != null
        ? Math.abs(
            userBearing -
              currentLeg.steps[currentStepIndex + 1].maneuver.bearing_after,
          ) <= this.userBearingCompleteThreshold
        : false;

    let snapToLocation =
      distance < this.maxSnapToLocation ? closestPoint.geometry : userLocation;
    // Do not increment userCurrentStep if the user is approaching the final step

    console.log('stepDistance', stepDistance);
    console.log('stepDistanceInKm', stepDistanceInKm);
    console.log('userDistanceToEndStepInKm', userDistanceToEndStepInKm);
    console.log('userDistanceToEndStep', userDistanceToEndStep);
    console.log('userDistanceToEndStep', userDistanceToEndStep);
    console.log('modifiedCompletionDistance', modifiedCompletionDistance);
    console.log('userAbsoluteDistance', userAbsoluteDistance);
    console.log('withinBearingThreshold', withinBearingThreshold);

    let stepIndex: number;

    console.log('currentStepIndex', currentStepIndex);
    console.log('currentLeg.steps.length', currentLeg.steps.length);

    // if (currentStepIndex < currentLeg.steps.length - 2) {
    if (userDistanceToEndStep < modifiedCompletionDistance) {
      this.userHasEnteredManeuverZone = true;
      snapToLocation = userLocation;
    } else {
      this.userHasEnteredManeuverZone = false;
    }

    // Use the users absolute distance from the end of the maneuver point
    // Otherwise, as they move away from the maneuver point,
    // the distance will remain 0 since we're snapping to the closest point on the line
    if (
      this.userHasEnteredManeuverZone &&
      (userAbsoluteDistance > modifiedCompletionDistance ||
        withinBearingThreshold)
    ) {
      stepIndex = currentStepIndex + 1;

      return this.refreshNavigationState(
        navigationRoute,
        legIndex + 1,
        0,
        userLocation,
        userBearing,
      );

      if (stepIndex >= currentLeg.steps.length) {
        // stepIndex = 0;
        // legIndex += 1;
        // if (legIndex >= navigationRoute.legs.length) {
        //   this.finishNavigation();
        //   return;
        // }
        // stepIndex = 0;
        // snapToLocation = turf.point(
        //   (navigationRoute.legs[legIndex].steps[stepIndex].geometry as GeoJSON.LineString)
        //     .coordinates[0],
        // );
        // console.log('snapToLocation', snapToLocation);
        // this.userHasEnteredManeuverZone = false;
        // return this.refreshNavigationState(
        //   navigationRoute,
        //   legIndex,
        //   stepIndex,
        //   userLocation,
        //   userBearing,
        // );
        // this.finishNavigation();
        return;
      }
    } else {
      stepIndex = currentStepIndex;
      this.userHasEnteredManeuverZone = false;
    }
    // } else {
    //   console.log('leg too short');
    //   stepIndex = currentStepIndex;
    //   this.userHasEnteredManeuverZone = false;
    // }

    const absoluteDistance = userAbsoluteDistance;

    const distanceFromClosestPointInKm = turf.distance(
      userLocation,
      closestPoint,
      {
        units: 'kilometers',
      },
    );
    const distanceFromClosestPoint = distanceFromClosestPointInKm * 1000;
    const shouldReRoute = distanceFromClosestPoint >= this.maxReRouteDistance;

    const newState: NavigationState = {
      legIndex,
      stepIndex,
      snapToLocation,
      stepDistance,
      userDistanceToEndStep,
      absoluteDistance,
      shouldReRoute,

      // new values
      distanceFromClosestPoint,
      distanceFromClosestPointInKm,
      userLocation,
      userBearing: userBearing ?? 0,
      distanceInKm,
      distance,
      segmentRoute: currentStepRoute,
      closestPoint,
      segmentEndPoint,
      segmentSlicedToUser,
      userDistanceToEndStepInKm,
      userAbsoluteDistanceInKm,
      modifiedCompletionDistance,
      withinBearingThreshold,
    };

    // console.log('newState', newState);

    return newState;
  }

  finishNavigation() {}

  private rerouting: boolean = false;
  reroute() {
    if (this.rerouting) {
      return;
    }

    this.rerouting = true;
  }
}
