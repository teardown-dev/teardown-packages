import {Logger} from '../../logger';
import {Location} from '@rnmapbox/maps';
import * as turf from '@turf/turf';
import * as GeoJSON from 'geojson';
import {BaseEventEmitterEvent, EventEmitter, Events} from '../../event-emitter';

export type UserLocation = Location['coords'];

export type UserLocationChangedEvent = BaseEventEmitterEvent<
  'USER_LOCATION_CHANGED',
  {
    location: UserLocation;
  }
>;

export type UserLocationVisibilityChangedEvent = BaseEventEmitterEvent<
  'USER_LOCATION_VISIBILITY_CHANGED',
  {
    isVisible: boolean;
  }
>;

export type UserLocationEvents = Events<{
  USER_LOCATION_CHANGED: UserLocationChangedEvent;
  USER_LOCATION_VISIBILITY_CHANGED: UserLocationVisibilityChangedEvent;
}>;

export class UserLocationService {
  _userLocation: UserLocation | null = null;

  private logger: Logger;

  public emitter: EventEmitter<UserLocationEvents>;

  private _isVisible = false;

  constructor() {
    this.logger = new Logger('UserLocationService');
    this.emitter = new EventEmitter<UserLocationEvents>();
  }

  public setUserLocation(location: Location) {
    // this.logger.log('Setting user location', location);

    // Only update if the location has changed by more than 1 meter
    // const previousLocation = this.getUserLocation();
    //
    // if (previousLocation != null) {
    //   const distance = turf.distance(
    //     turf.point([previousLocation.latitude, previousLocation.longitude]),
    //     turf.point([location.coords.latitude, location.coords.longitude]),
    //     {units: 'meters'},
    //   );
    //
    //   // If the user has moved less than 1 meter, don't update the location
    //   if (distance < 1) {
    //     return;
    //   }
    // }

    this._userLocation = location.coords;

    this.emitter.emit('USER_LOCATION_CHANGED', {
      location: this._userLocation,
    });
  }

  public getUserLocation(): UserLocation | null {
    if (this._userLocation == null) {
      return null;
    }
    return this._userLocation;
  }

  public isVisible() {
    return this._isVisible;
  }

  public setVisibility(isVisible: boolean) {
    this._isVisible = isVisible;
    this.emitter.emit('USER_LOCATION_VISIBILITY_CHANGED', {
      isVisible: isVisible,
    });
  }
}
