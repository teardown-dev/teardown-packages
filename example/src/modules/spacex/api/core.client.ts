// coreClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';

export interface Core {
  serial: string;
  block: number | null;
  status: 'active' | 'inactive' | 'unknown' | 'expended' | 'lost' | 'retired';
  reuse_count: number;
  rtls_attempts: number;
  rtls_landings: number;
  asds_attempts: number;
  asds_landings: number;
  last_update: string | null;
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

class CoreClient {
  constructor(private api: AxiosInstance) {}

  async getAllCores(): Promise<AxiosResponse<Core[]>> {
    return this.api.get('/cores');
  }

  async getCoreById(id: string): Promise<AxiosResponse<Core>> {
    return this.api.get(`/cores/${id}`);
  }

  async queryCores(
    options: QueryOptions,
  ): Promise<AxiosResponse<QueryResult<Core>>> {
    return this.api.post('/cores/query', options);
  }
}

export default CoreClient;
