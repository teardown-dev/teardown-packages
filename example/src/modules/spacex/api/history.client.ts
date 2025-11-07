// historyClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';

export interface HistoryEvent {
  title: string | null;
  event_date_utc: string | null;
  event_date_unix: number | null;
  details: string | null;
  links: {
    article: string | null;
  };
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

class HistoryClient {
  constructor(private api: AxiosInstance) {}

  async getAllHistory(): Promise<AxiosResponse<HistoryEvent[]>> {
    return this.api.get('/history');
  }

  async getHistoryById(id: string): Promise<AxiosResponse<HistoryEvent>> {
    return this.api.get(`/history/${id}`);
  }

  async queryHistory(
    options: QueryOptions,
  ): Promise<AxiosResponse<QueryResult<HistoryEvent>>> {
    return this.api.post('/history/query', options);
  }
}

export default HistoryClient;
