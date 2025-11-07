// roadsterClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';

export interface Roadster {
  name: string;
  launch_date_utc: string;
  launch_date_unix: number;
  launch_mass_kg: number;
  launch_mass_lbs: number;
  norad_id: number;
  epoch_jd: number;
  orbit_type: string;
  apoapsis_au: number;
  periapsis_au: number;
  semi_major_axis_au: number;
  eccentricity: number;
  inclination: number;
  longitude: number;
  periapsis_arg: number;
  period_days: number;
  speed_kph: number;
  speed_mph: number;
  earth_distance_km: number;
  earth_distance_mi: number;
  mars_distance_km: number;
  mars_distance_mi: number;
  wikipedia: string;
  video: string;
  details: string;
  id: string;
}

class RoadsterClient {
  constructor(private api: AxiosInstance) {}

  async getRoadsterInfo(): Promise<AxiosResponse<Roadster>> {
    return this.api.get('/roadster');
  }
}

export default RoadsterClient;
