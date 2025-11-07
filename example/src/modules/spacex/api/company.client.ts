// companyClient.ts
import {AxiosInstance, AxiosResponse} from 'axios';

export interface CompanyInfo {
  name: string;
  founder: string;
  founded: number;
  employees: number;
  vehicles: number;
  launch_sites: number;
  test_sites: number;
  ceo: string;
  cto: string;
  coo: string;
  cto_propulsion: string;
  valuation: number;
  headquarters: {
    address: string;
    city: string;
    state: string;
  };
  links: {
    website: string;
    flickr: string;
    twitter: string;
    elon_twitter: string;
  };
  summary: string;
  id: string;
}

class CompanyClient {
  constructor(private api: AxiosInstance) {}

  async getCompanyInfo(): Promise<AxiosResponse<CompanyInfo>> {
    return this.api.get('/company');
  }
}

export default CompanyClient;
