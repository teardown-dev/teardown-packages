import {
  BannerInstruction,
  Route,
  VoiceInstruction,
} from '@mapbox/mapbox-sdk/services/directions';
import {Location} from '@rnmapbox/maps';
import * as turf from '@turf/turf';

import {EventEmitter} from './event-emitter';
import {
  Camera,
  NavigationState,
  NavigationProgress,
  NavigationActions,
  Directions,
} from './event.types';

export type UserLocation = Location['coords'] & {
  coords: GeoJSON.Position;
};

// There is probably a better way to do this, but I kinda like this approach
export class NavigationBlackbox {
  // Global state tracking
  private _waypoints: GeoJSON.Position[] | null = null;
  private _directions: Directions | null = null;
  private _userLocation: Location | null = null;
  private _camera: Camera | null = null;

  // These are used for the active navigation route
  private _navigationRoute: Route<GeoJSON.LineString> | null = null;
  private _navigationActions: NavigationActions = {};
  private _navigationState: NavigationState | null = null;
  private _navigationProgress: NavigationProgress | null = null;

  public emitter = new EventEmitter();

  public getUserLocation(): UserLocation | null {
    if (this._userLocation == null) {
      return null;
    }

    return {
      ...this._userLocation.coords,
      coords: [
        this._userLocation.coords.latitude,
        this._userLocation.coords.longitude,
      ] as GeoJSON.Position,
    };
  }

  public setUserLocation(location: Location) {
    // Only update if the location has changed by more than 1 meter
    const previousLocation = this.getUserLocation();

    if (previousLocation != null) {
      const distance = turf.distance(
        turf.point(previousLocation.coords),
        turf.point([location.coords.latitude, location.coords.longitude]),
        {units: 'meters'},
      );

      if (distance < 1) {
        return;
      }
    }

    this._userLocation = location;
    this.emitter.emit('USER_LOCATION_CHANGED', {
      location,
    });
  }

  public getWaypoints(): GeoJSON.Position[] {
    return this._waypoints ?? [];
  }

  public setWaypoints(waypoints: GeoJSON.Position[]) {
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

  public getCamera(): Camera | null {
    return this._camera;
  }

  public setCamera(camera: Camera) {
    this._camera = camera;
    this.emitter.emit('CAMERA_CHANGED', {
      camera,
    });
  }

  public getNavigationRoute(): Route<GeoJSON.LineString> | null {
    return this._navigationRoute;
  }

  public setNavigationRoute(route: Route<GeoJSON.LineString>) {
    this._navigationRoute = route;
    this.emitter.emit('NAVIGATION_ROUTE_CHANGED', {
      navigationRoute: route,
    });
  }

  public getNavigationActions() {
    return this._navigationActions;
  }

  public setNavigationActions(actions: NavigationActions) {
    this._navigationActions = actions;
    this.emitter.emit('NAVIGATION_ACTIONS_CHANGED', {
      actions,
    });
  }

  public getNavigationState() {
    return this._navigationState;
  }

  public setNavigationState(state: NavigationState) {
    this._navigationState = state;
    this.emitter.emit('NAVIGATION_STATE_CHANGED', {
      state,
    });
  }

  public getNavigationProgress() {
    return this._navigationProgress;
  }

  public setNavigationProgress(progress: NavigationProgress) {
    this._navigationProgress = progress;
    this.emitter.emit('NAVIGATION_PROGRESS_CHANGED', {
      progress,
    });
  }

  shutdown() {
    this.emitter.removeAllListeners();
  }
}
