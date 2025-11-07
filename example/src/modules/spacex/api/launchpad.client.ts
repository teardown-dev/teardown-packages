// launchpadClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';

export interface Launchpad {
  name: string;
  full_name: string;
  locality: string;
  region: string;
  timezone: string;
  latitude: number;
  longitude: number;
  launch_attempts: number;
  launch_successes: number;
  rockets: string[];
  launches: string[];
  status: string;
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

class LaunchpadClient {
  constructor(private api: AxiosInstance) {}

  async getLaunchpads(
    options: QueryOptions,
  ): Promise<AxiosResponse<QueryResult<Launchpad>>> {
    return this.api.post('/launchpads/query', options);
  }

  async getLaunchpadById(id: string): Promise<AxiosResponse<Launchpad>> {
    return this.api.get(`/launchpads/${id}`);
  }
}

export default LaunchpadClient;
