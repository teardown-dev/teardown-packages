// capsuleClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';
import {QueryOptions, QueryResult} from './types';

export interface Capsule {
  serial: string;
  status: 'unknown' | 'active' | 'retired' | 'destroyed';
  type: 'Dragon 1.0' | 'Dragon 1.1' | 'Dragon 2.0';
  dragon?: string;
  reuse_count: number;
  water_landings: number;
  land_landings: number;
  last_update: string | null;
  launches: string[];
  id: string;
}

class CapsuleClient {
  constructor(private api: AxiosInstance) {}

  async getAllCapsules(): Promise<AxiosResponse<Capsule[]>> {
    return this.api.get('/capsules');
  }

  async getCapsuleById(id: string): Promise<AxiosResponse<Capsule>> {
    return this.api.get(`/capsules/${id}`);
  }

  async queryCapsules(
    options: QueryOptions,
  ): Promise<AxiosResponse<QueryResult<Capsule>>> {
    return this.api.post('/capsules/query', options);
  }
}

export default CapsuleClient;
