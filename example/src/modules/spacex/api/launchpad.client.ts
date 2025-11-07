// launchpadClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';
import {QueryOptions, QueryResult} from './types';

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
