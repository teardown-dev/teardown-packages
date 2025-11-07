import {
  BannerInstruction,
  DirectionsResponse,
  Leg,
  Maneuver,
  Route,
  Step,
  VoiceInstruction,
} from '@mapbox/mapbox-sdk/services/directions';
import {Location} from '@rnmapbox/maps';
import * as turf from '@turf/turf';

export type Directions = DirectionsResponse<GeoJSON.LineString>;

export type EventEmitterEvent<
  Type extends EventTypes,
  Payload extends Record<string, any> = object,
> = {
  timestamp: number;
  type: Type;
  payload: Payload;
};

export type WaypointsChangedEvent = EventEmitterEvent<
  'WAYPOINTS_CHANGED',
  {
    waypoints: GeoJSON.Position[];
  }
>;

export type DirectionsChangedEvent = EventEmitterEvent<
  'DIRECTIONS_CHANGED',
  {
    directions: Directions;
  }
>;

export type UserLocationChangedEvent = EventEmitterEvent<
  'USER_LOCATION_CHANGED',
  {
    location: Location;
  }
>;

export type NavigationRouteChangedEvent = EventEmitterEvent<
  'NAVIGATION_ROUTE_CHANGED',
  {
    navigationRoute: Route<GeoJSON.LineString>;
  }
>;

export type NavigationActions = {
  [leg: number]: {
    [step: number]: {
      [distance: number]: {
        maneuver?: Maneuver;
        bannerInstruction?: BannerInstruction;
        voiceInstruction?: VoiceInstruction & {instructionUsed: boolean};
      };
    };
  };
};

export type NavigationActionsChangedEvent = EventEmitterEvent<
  'NAVIGATION_ACTIONS_CHANGED',
  {
    actions: NavigationActions;
  }
>;

export type NavigationState = {
  legIndex: number;
  stepIndex: number;
  // bannerInstructionIndex: number; // -1 means no banner instruction
  // voiceInstructionIndex: number; // -1 means no voice instruction
  snapToLocation: GeoJSON.Point;
  stepDistance: number;
  userDistanceToEndStep: number;
  absoluteDistance: number;
  shouldReRoute: boolean;

  distanceFromClosestPoint: number;
  distanceFromClosestPointInKm: number;
  userLocation: GeoJSON.Point;
  userBearing: number;
  distanceInKm: number;
  distance: number;
  segmentRoute: GeoJSON.Feature<GeoJSON.LineString>;
  closestPoint: GeoJSON.Feature<GeoJSON.Point>;
  segmentEndPoint: GeoJSON.Feature<GeoJSON.Point>;
  segmentSlicedToUser: GeoJSON.Feature<GeoJSON.LineString>;
  userDistanceToEndStepInKm: number;
  userAbsoluteDistanceInKm: number;
  modifiedCompletionDistance: number;
  withinBearingThreshold: boolean;
};

export type NavigationStateChangedEvent = EventEmitterEvent<
  'NAVIGATION_STATE_CHANGED',
  {
    state: NavigationState;
  }
>;

export type NavigationProgress = {
  /**
   * Represents the progress of a task, expressed as a number.
   * A value of 0.0 indicates that the task has just started, 1.0 indicates that the task is complete,
   * and any value in between indicates the percentage of the task that has been completed.
   *
   * @type {number}
   */
  totalProgress: number;

  closestPointOnLine: GeoJSON.Point;
  completedRoute: GeoJSON.Feature<GeoJSON.LineString> | null;
  completedDistance: number;
  completedPercentage: number;
  remainingRoute: GeoJSON.Feature<GeoJSON.LineString>;
  remainingDistance: number;
  remainingPercentage: number;

  step: {
    completedRoute: GeoJSON.Feature<GeoJSON.LineString> | null;
    completedDistance: number;
    completedPercentage: number;
    remainingRoute: GeoJSON.Feature<GeoJSON.LineString>;
    remainingDistance: number;
    remainingPercentage: number;
  };

  // legIndex: number;
  // leg: Leg;
  // stepIndex: number;
  // step: Step;
};

export type NavigationProgressChangedEvent = EventEmitterEvent<
  'NAVIGATION_PROGRESS_CHANGED',
  {
    progress: NavigationProgress;
  }
>;

export type Camera = {
  pitch: number;
  heading: number;
  zoom: number;
  center: GeoJSON.Position;
};

export type CameraChangedEvent = EventEmitterEvent<
  'CAMERA_CHANGED',
  {
    camera: Camera;
  }
>;

export type Events =
  | WaypointsChangedEvent
  | DirectionsChangedEvent
  | UserLocationChangedEvent
  | NavigationRouteChangedEvent
  | NavigationActionsChangedEvent
  | NavigationStateChangedEvent
  | NavigationProgressChangedEvent
  | CameraChangedEvent;

export type EventTypes = Events['type'];

export type EventEmitterEventPayloads = {
  [Type in EventTypes]: Extract<Events, {type: Type}>['payload'];
};
