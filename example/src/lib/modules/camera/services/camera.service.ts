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
import * as turf from '@turf/turf';
import {MmkvService} from '../../../../modules/home/services/mmkv.service.ts';

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

export type CameraCenterChangedEvent = BaseEventEmitterEvent<
  'CAMERA_CENTER_CHANGED',
  {
    center: GeoJSON.Position;
  }
>;

export type CameraPitchChangedEvent = BaseEventEmitterEvent<
  'CAMERA_PITCH_CHANGED',
  {
    pitch: number;
  }
>;

export type CameraHeadingChangedEvent = BaseEventEmitterEvent<
  'CAMERA_HEADING_CHANGED',
  {
    heading: number;
  }
>;

export type CameraZoomLevelChangedEvent = BaseEventEmitterEvent<
  'CAMERA_ZOOM_LEVEL_CHANGED',
  {
    zoomLevel: number;
  }
>;

export type CameraPaddingChangedEvent = BaseEventEmitterEvent<
  'CAMERA_PADDING_CHANGED',
  {
    padding: CameraStop['padding'];
  }
>;

export type CameraEvents = Events<{
  CAMERA_STATE_CHANGED: CameraStateChangedEvent;
  CAMERA_LOCK_CHANGED: CameraLockChangedEvent;
  CAMERA_CENTER_CHANGED: CameraCenterChangedEvent;
  CAMERA_PITCH_CHANGED: CameraPitchChangedEvent;
  CAMERA_HEADING_CHANGED: CameraHeadingChangedEvent;
  CAMERA_ZOOM_LEVEL_CHANGED: CameraZoomLevelChangedEvent;
}>;

export type CameraConfig = Partial<
  Omit<CameraStop, 'padding'> & {
    padding: Partial<CameraStop['padding']>;
  }
>;

export class CameraService {
  private readonly MIN_PADDING = 24;

  private logger: Logger;
  private mmkvService: MmkvService;
  private userLocation: UserLocationService;

  private _pitch = 0;
  private _heading = 0;
  private _zoomLevel = 14;
  private _center: GeoJSON.Position = [0, 0];
  private _padding: NonNullable<CameraStop['padding']> = {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
  };

  private _locked = true;

  public emitter: EventEmitter<CameraEvents>;
  public ref = createRef<CameraRef>();

  constructor(userLocation: UserLocationService) {
    this.logger = new Logger('CameraService');
    this.mmkvService = new MmkvService('CameraService');
    this.userLocation = userLocation;

    this.emitter = new EventEmitter<CameraEvents>();
    this.emitter.on('CAMERA_LOCK_CHANGED', this.onCameraLockChanged.bind(this));
    this.userLocation.emitter.on(
      'USER_LOCATION_CHANGED',
      this.onUserLocationChanged.bind(this),
    );
  }

  setPitch(pitch: number) {
    this._pitch = pitch;
    this.emitter.emit('CAMERA_PITCH_CHANGED', {
      pitch,
    });
  }

  getPitch() {
    return this._pitch;
  }

  setHeading(heading: number) {
    this._heading = heading;
    this.emitter.emit('CAMERA_HEADING_CHANGED', {
      heading,
    });
  }

  getBearing() {
    return this._heading;
  }

  setZoomLevel(zoomLevel: number) {
    this._zoomLevel = zoomLevel;
    this.emitter.emit('CAMERA_ZOOM_LEVEL_CHANGED', {
      zoomLevel,
    });
  }

  getZoomLevel() {
    return this._zoomLevel;
  }

  setCenter(center: GeoJSON.Position) {
    this._center = center;
    this.emitter.emit('CAMERA_CENTER_CHANGED', {
      center,
    });
  }

  onCameraChanged(state: MapState) {
    this.logger.log('onCameraChanged', state);
    // We only set the internal state when an event comes in from the map
    // this is to prevent an infinite loop of events

    // When we set the camera state this sets it directly on the map
    // Then the map emits an event which we listen to and set the internal state
    // Then we emit events for what has changed and other services can listen to these events to update their state

    // this.logger.log('onCameraChanged', state);
    this.setPitch(state.properties.pitch);
    this.setHeading(state.properties.heading);
    this.setZoomLevel(state.properties.zoom);
    this.setCenter(state.properties.center);

    if (state.gestures.isGestureActive) {
      this.setLocked(false);
    }
  }

  setLocked(locked: boolean) {
    this.logger.log('setLocked', locked);
    this._locked = locked;
    this.emitter.emit('CAMERA_LOCK_CHANGED', {
      isLocked: locked,
    });
  }

  getPadding() {
    const paddingLeft = Math.max(this.MIN_PADDING, this._padding.paddingLeft);
    const paddingRight = Math.max(this.MIN_PADDING, this._padding.paddingRight);
    const paddingTop = Math.max(this.MIN_PADDING, this._padding.paddingTop);
    const paddingBottom = Math.max(
      this.MIN_PADDING,
      this._padding.paddingBottom,
    );

    return {
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
    };
  }

  setCamera(config: Omit<CameraConfig, 'padding'> & { padding?: Partial<CameraConfig>['padding'] }) {
    // console.log('setCamera', config);

    const currentCenter = this._center;
    const currentZoomLevel = this._zoomLevel;
    const currentPitch = this._pitch;
    const currentBearing = this._heading;
    const currentPadding = this.getPadding();

    const newCamera: CameraStop = {
      animationDuration: 500,
      animationMode: 'easeTo',
      zoomLevel: currentZoomLevel,
      pitch: currentPitch,
      centerCoordinate: currentCenter,
      heading: currentBearing,
      ...config,
      padding: {
        ...currentPadding,
        ...config.padding,
      },
    };

    // console.trace('newCamera', newCamera);

    this.ref.current?.setCamera(newCamera);
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

  toggleCameraLock() {
    this.logger.log('Toggling camera lock');
    this.setLocked(!this._locked);
  }

  onCameraLockChanged(event: CameraLockChangedEvent) {
    const {
      payload: {isLocked},
    } = event;

    if (isLocked) {
      const userLocation = this.userLocation.getUserLocation();

      if (userLocation != null) {
        this.setCamera({
          centerCoordinate: [userLocation.longitude, userLocation.latitude],
        });
      }
    }
  }

  onUserLocationChanged(event: UserLocationChangedEvent) {
    // this.logger.log('onUserLocationChanged', event);
    const {
      payload: {location},
    } = event;

    if (!this._locked) {
      return;
    }

    this.setCamera({
      heading: location.heading,
      centerCoordinate: [location.longitude, location.latitude],
    });
  }

  calculateDistanceBetweenPoints(
    point1: GeoJSON.Position,
    point2: GeoJSON.Position,
  ) {
    return turf.distance(point1, point2);
  }
}
