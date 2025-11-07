// shipClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';

export interface Ship {
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

class ShipClient {
  constructor(private api: AxiosInstance) {}

  async getShips(
    options: QueryOptions,
  ): Promise<AxiosResponse<QueryResult<Ship>>> {
    return this.api.post('/ships/query', options);
  }

  async getShipById(id: string): Promise<AxiosResponse<Ship>> {
    return this.api.get(`/ships/${id}`);
  }
}

export default ShipClient;
