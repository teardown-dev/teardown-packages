// crewClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';

export interface CrewMember {
  name: string | null;
  status: 'active' | 'inactive' | 'retired' | 'unknown';
  agency: string | null;
  image: string | null;
  wikipedia: string | null;
  launches: string[];
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
