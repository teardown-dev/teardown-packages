import {
  DirectionsClient,
  type DirectionsRequest,
  type DirectionsResponse,
  type DirectionsService,
  type DirectionsWaypoint,
  GeocodingClient,
  GeocodeService,
  type Route,
} from '../mapbox.ts';

type Directions = DirectionsResponse<GeoJSON.LineString>;

export type {Directions, DirectionsWaypoint, Route};

export class MapboxService {
  private readonly accessToken: string;
  private directionsClient: DirectionsService;
  private geocodingClient: GeocodeService;

  constructor(accessToken: string) {
    this.accessToken = accessToken;

    this.directionsClient = DirectionsClient({
      accessToken: this.accessToken,
    });

    this.geocodingClient = GeocodingClient({
      accessToken: this.accessToken,
    });
  }

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

    // TODO: This cast could cause problems if it returns a multi-line string
    return data.body as DirectionsResponse<GeoJSON.LineString>;
  }

  searchForLocation(query: string) {
    return this.geocodingClient.forwardGeocode({
      query,
    });
  }
}
