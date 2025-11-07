import DirectionsClient, {
  type DirectionsRequest,
  type DirectionsResponse,
  type DirectionsWaypoint,
  type Route,
} from '@mapbox/mapbox-sdk/services/directions';

type Directions = DirectionsResponse<GeoJSON.LineString>;

export type {Directions, DirectionsWaypoint, Route};

export class MapboxService {
  directionsClient = DirectionsClient({
    accessToken:
      'pk.eyJ1IjoidXJiYW5jaHJpc3kiLCJhIjoiY2xzbGo5cnhwMGVoazJqcDY0N3RqeG92OSJ9.C9sIOo45b61JpdvgbMhtVw',
  });

  async getRoute(
    waypoints: GeoJSON.Position[],
    options?: Partial<DirectionsRequest>,
  ) {
    const directionsWaypoints: DirectionsWaypoint[] = waypoints.map(
      waypoint => ({
        coordinates: [waypoint[0], waypoint[1]] as [number, number],
      }),
    );

    const data = await this.directionsClient
      .getDirections({
        overview: 'full',
        waypoints: directionsWaypoints,
        continueStraight: true,
        profile: 'driving',
        ...options,
        geometries: 'geojson',
      })
      .send();

    // DING DONG: This cast could cause problems if it returns a multi-line string
    return data.body as DirectionsResponse<GeoJSON.LineString>;
  }
}
