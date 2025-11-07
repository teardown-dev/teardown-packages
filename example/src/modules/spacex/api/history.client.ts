// historyClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';
import {QueryOptions, QueryResult} from './types';

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
