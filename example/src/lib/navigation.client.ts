import * as turf from '@turf/turf';
import {CameraService} from './modules/camera';
import {MapboxService} from './modules/mapbox';
import {RouteService} from './modules/route';
import {UserLocationService} from './modules/user-location';
import {NavigationStateService} from './modules/navigation';
import {BannerService} from './modules/banner';
import {Logger} from './modules/logger';
import {ManeuverService} from './modules/maneuver';
import {RerouteService} from './modules/reroute';
import {Util} from '@teardown/util';

export type NavigationClientOptions = {
  accessToken: string;
  waypoints: GeoJSON.Position[];
};

export class NavigationClient {
  id = Util.generateUUID();

  logger: Logger;

  mapboxService: MapboxService;
  userLocationService: UserLocationService;
  routeService: RouteService;
  cameraService: CameraService;
  navigationState: NavigationStateService;
  bannerService: BannerService;
  maneuverService: ManeuverService;
  rerouteService: RerouteService;

  constructor(options: NavigationClientOptions) {
    const {accessToken, waypoints} = options;

    this.logger = new Logger('NavigationClient');
    this.mapboxService = new MapboxService(accessToken);
    this.userLocationService = new UserLocationService();
    this.cameraService = new CameraService(this.userLocationService);
    this.routeService = new RouteService(
      this.mapboxService,
      this.userLocationService,
      this.cameraService,
    );

    this.navigationState = new NavigationStateService(
      this.userLocationService,
      this.routeService,
      this.cameraService,
    );

    this.bannerService = new BannerService(
      this.navigationState,
      this.userLocationService,
      this.cameraService,
    );
    this.maneuverService = new ManeuverService(
      this.navigationState,
      this.cameraService,
      this.routeService,
      this.userLocationService,
    );
    this.rerouteService = new RerouteService(
      this.navigationState,
      this.routeService,
    );

    this.routeService.setWaypoints(waypoints);
  }

  startFromNearestWaypoint(
    waypoints: GeoJSON.Position[],
    currentLocation: GeoJSON.Position,
  ) {
    let distance = Infinity;
    let closestWaypointIndex = -1;
    for (let i = 0; i < waypoints.length; i++) {
      const waypoint = waypoints[i];

      const d = turf.distance(currentLocation, waypoint);

      if (d < distance) {
        distance = d;
        closestWaypointIndex = i;
      }
    }

    if (closestWaypointIndex !== Infinity) {
      return waypoints.slice(closestWaypointIndex);
    }

    return waypoints;
  }

  navigate() {}

  shutdown() {
    // this.blackbox.shutdown();
  }
}
