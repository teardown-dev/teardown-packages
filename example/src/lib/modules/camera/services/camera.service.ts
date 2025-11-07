import {createRef} from 'react';

import {BaseEventEmitterEvent, EventEmitter, Events} from '../../event-emitter';
import {
  CameraRef,
  CameraStop,
  CameraStops,
} from '@rnmapbox/maps/lib/typescript/src/components/Camera';
import {Logger} from '../../logger';
import {
  UserLocationChangedEvent,
  UserLocationService,
} from '../../user-location';
import * as GeoJSON from 'geojson';
import {MapState} from '@rnmapbox/maps';

export type CameraState = MapState & {};

export type CameraStateChangedEvent = BaseEventEmitterEvent<
  'CAMERA_STATE_CHANGED',
  {
    state: CameraState;
  }
>;

export type CameraLockChangedEvent = BaseEventEmitterEvent<
  'CAMERA_LOCK_CHANGED',
  {
    isLocked: boolean;
  }
>;

export type CameraEvents = Events<{
  CAMERA_STATE_CHANGED: CameraStateChangedEvent;
  CAMERA_LOCK_CHANGED: CameraLockChangedEvent;
}>;

export class CameraService {
  private logger: Logger;
  private userLocation: UserLocationService;

  // The current camera state of the map - this is emitted
  private _cameraState: MapState | null = null;
  private _locked = true;

  public emitter: EventEmitter<CameraEvents>;
  public ref = createRef<CameraRef>();

  constructor(userLocation: UserLocationService) {
    this.logger = new Logger('CameraService');
    this.userLocation = userLocation;

    this.emitter = new EventEmitter<CameraEvents>();

    this.userLocation.emitter.on('USER_LOCATION_CHANGED', event =>
      this.onUserLocationChanged(event),
    );
  }

  onCameraChanged(state: MapState) {
    // this.logger.log('onCameraChanged', state);
    this.setCameraState(state);
  }

  setCameraState(state: MapState) {
    // this.logger.log('setCameraState', camera);

    const cameraState: CameraState = {
      ...state,
    };

    if (cameraState.gestures.isGestureActive) {
      if (this._locked) {
        this.unlockCamera();
      }
    }

    this._cameraState = cameraState;
    this.emitter.emit('CAMERA_STATE_CHANGED', {
      state: cameraState,
    });
  }

  setLocked(locked: boolean) {
    this.logger.log('setLocked', locked);
    this._locked = locked;
    this.emitter.emit('CAMERA_LOCK_CHANGED', {
      isLocked: locked,
    });
  }

  setCamera(config: CameraStop) {
    if (!this._locked) {
      return;
    }

    this.ref.current?.setCamera({
      animationDuration: 500,
      animationMode: 'easeTo',
      zoomLevel: 16,
      pitch: 45,
      ...config,
    });
  }

  setCameraStops(stops: CameraStops) {
    this.ref.current?.setCamera(stops);
  }

  isLocked() {
    return this._locked;
  }

  lockCamera() {
    this.logger.log('Locking camera');
    this.setLocked(true);
  }

  unlockCamera() {
    this.logger.log('Unlocking camera');
    this.setLocked(false);
  }

  onUserLocationChanged(event: UserLocationChangedEvent) {
    // this.logger.log('onUserLocationChanged', event);
    const {
      payload: {location},
    } = event;

    if (!this._locked) {
      return;
    }

    // this.setCamera({
    //   centerCoordinate: [location.longitude, location.latitude],
    //   zoomLevel: 16,
    //   pitch: 35,
    //   animationDuration: 250,
    //   animationMode: 'easeTo',
    //   heading: location.heading,
    // });
  }
}
