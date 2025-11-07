import axios, {AxiosInstance} from 'axios';
import CapsuleClient from './api/capsule.client';
import CompanyClient from './api/company.client';
import CoreClient from './api/core.client';
import CrewClient from './api/crew.client';
import DragonClient from './api/dragon.client';
import HistoryClient from './api/history.client';
import LaunchClient from './api/launch.client';
import LaunchpadClient from './api/launchpad.client';
import PayloadClient from './api/payload.client';
import RoadsterClient from './api/roadster.client';
import RocketClient from './api/rocket.client';
import ShipClient from './api/ship.client';
import StarlinkClient from './api/starlink.client';

class SpaceXClient {
  private v4Api: AxiosInstance;
  private v5Api: AxiosInstance;

  capsules: CapsuleClient;
  company: CompanyClient;
  cores: CoreClient;
  crew: CrewClient;
  dragons: DragonClient;
  history: HistoryClient;
  launches: LaunchClient;
  launchpads: LaunchpadClient;
  payloads: PayloadClient;
  roadster: RoadsterClient;
  rockets: RocketClient;
  ships: ShipClient;
  starlink: StarlinkClient;

  constructor() {
    this.v4Api = axios.create({
      baseURL: 'https://api.spacexdata.com/v4',
      timeout: 10000,
    });

    this.v5Api = axios.create({
      baseURL: 'https://api.spacexdata.com/v5',
      timeout: 10000,
    });

    this.capsules = new CapsuleClient(this.v5Api);
    this.company = new CompanyClient(this.v4Api);
    this.cores = new CoreClient(this.v5Api);
    this.crew = new CrewClient(this.v5Api);
    this.dragons = new DragonClient(this.v4Api);
    this.history = new HistoryClient(this.v5Api);
    this.launches = new LaunchClient(this.v5Api);
    this.launchpads = new LaunchpadClient(this.v4Api);
    this.payloads = new PayloadClient(this.v4Api);
    this.roadster = new RoadsterClient(this.v4Api);
    this.rockets = new RocketClient(this.v4Api);
    this.ships = new ShipClient(this.v4Api);
    this.starlink = new StarlinkClient(this.v4Api);
  }

  v4(): AxiosInstance {
    return this.v4Api;
  }

  v5(): AxiosInstance {
    return this.v5Api;
  }
}

export default SpaceXClient;
