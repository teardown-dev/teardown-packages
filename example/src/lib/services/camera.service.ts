import {Camera} from '@rnmapbox/maps';
import {createRef} from 'react';

import {NavigationBlackbox} from './blackbox';
import {
  CameraChangedEvent,
  UserLocationChangedEvent,
} from './blackbox/event.types';

export class CameraService {
  private _locked = true;

  ref = createRef<Camera>();

  constructor(blackbox: NavigationBlackbox) {
    blackbox.emitter.on('CAMERA_CHANGED', event => {});

    blackbox.emitter.on('USER_LOCATION_CHANGED', event =>
      this.onUserLocationChanged(event),
    );
  }

  isLocked() {
    return this._locked;
  }

  lock() {
    this._locked = true;
  }

  unlock() {
    this._locked = false;
  }

  onCameraChanged(event: CameraChangedEvent) {}

  onUserLocationChanged(event: UserLocationChangedEvent) {
    const {
      payload: {location},
    } = event;

    if (!this.isLocked()) {
      return;
    }

    // this.ref.current?.setCamera({
    //   centerCoordinate: [location.coords.longitude, location.coords.latitude],
    //   zoomLevel: 15,
    //   animationDuration: 250,
    //   animationMode: 'easeTo',
    // });
  }
}
