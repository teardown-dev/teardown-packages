// crewClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';
import {QueryOptions, QueryResult} from './types';

export interface CrewMember {
  name: string | null;
  status: 'active' | 'inactive' | 'retired' | 'unknown';
  agency: string | null;
  image: string | null;
  wikipedia: string | null;
  launches: string[];
  id: string;
}

class CrewClient {
  constructor(private api: AxiosInstance) {}

  async getAllCrew(): Promise<AxiosResponse<CrewMember[]>> {
    return this.api.get('/crew');
  }

  async getCrewMemberById(id: string): Promise<AxiosResponse<CrewMember>> {
    return this.api.get(`/crew/${id}`);
  }

  async queryCrew(
    options: QueryOptions,
  ): Promise<AxiosResponse<QueryResult<CrewMember>>> {
    return this.api.post('/crew/query', options);
  }
}

export default CrewClient;
