import {v4 as uuid} from 'uuid';

import {NavigationBlackbox} from './blackbox';
import {CameraService} from './camera.service';
import {MapboxService} from './mapbox.service';
import {RouteService} from './route.service';

export class NavigationService {
  id = uuid();

  mapbox: MapboxService;
  blackbox: NavigationBlackbox;
  route: RouteService;
  camera: CameraService;

  constructor(waypoints: GeoJSON.Position[]) {
    this.mapbox = new MapboxService();
    this.blackbox = new NavigationBlackbox();
    this.camera = new CameraService(this.blackbox);
    this.route = new RouteService(this.mapbox, this.blackbox, this.camera);

    this.blackbox.setWaypoints(waypoints);
  }

  shutdown() {
    this.blackbox.shutdown();
  }
}
