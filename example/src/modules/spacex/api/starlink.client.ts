// shipClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';

export interface StarlinkSatellite {
  legacy_id: string;
  model: string | null;
  type: string;
  roles: string[];
  imo: number;
  mmsi: number;
  abs: number;
  class: number;
  mass_kg: number;
  mass_lbs: number;
  year_built: number;
  home_port: string;
  status: string;
  speed_kn: number | null;
  course_deg: number | null;
  latitude: number | null;
  longitude: number | null;
  last_ais_update: string | null;
  link: string;
  image: string;
  launches: string[];
  name: string;
  active: boolean;
  id: string;
}

class StarlinkClient {
  constructor(private api: AxiosInstance) {}

  async getSatellites(): Promise<AxiosResponse<StarlinkSatellite[]>> {
    return this.api.get('/starlink');
  }
}

export default StarlinkClient;
