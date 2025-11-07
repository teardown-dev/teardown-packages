// payloadClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';

export interface Payload {
  dragon: {
    capsule: string | null;
    mass_returned_kg: number | null;
    mass_returned_lbs: number | null;
    flight_time_sec: number | null;
    manifest: string | null;
    water_landing: boolean | null;
    land_landing: boolean | null;
  };
  name: string;
  type: string;
  reused: boolean;
  launch: string;
  customers: string[];
  norad_ids: number[];
  nationalities: string[];
  manufacturers: string[];
  mass_kg: number;
  mass_lbs: number;
  orbit: string;
  reference_system: string;
  regime: string;
  longitude: number | null;
  semi_major_axis_km: number | null;
  eccentricity: number | null;
  periapsis_km: number | null;
  apoapsis_km: number | null;
  inclination_deg: number | null;
  period_min: number | null;
  lifespan_years: number | null;
  epoch: string | null;
  mean_motion: number | null;
  raan: number | null;
  arg_of_pericenter: number | null;
  mean_anomaly: number | null;
  id: string;
}

export interface QueryOptions {
  query: Record<string, any>;
  options: Record<string, any>;
}

export interface QueryResult<T> {
  docs: T[];
  totalDocs: number;
  offset: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

class PayloadClient {
  constructor(private api: AxiosInstance) {}

  async getPayloads(
    options: QueryOptions,
  ): Promise<AxiosResponse<QueryResult<Payload>>> {
    return this.api.post('/payloads/query', options);
  }

  async getPayloadById(id: string): Promise<AxiosResponse<Payload>> {
    return this.api.get(`/payloads/${id}`);
  }
}

export default PayloadClient;
