import {
  NavigationStateChangedEvent,
  NavigationStateService,
} from '../../navigation';
import {Logger} from '../../logger';
import {RouteService} from '../../route';

export class RerouteService {
  private logger: Logger;

  navigationStateService: NavigationStateService;
  routeService: RouteService;
  rerouting = false;

  constructor(
    navigationStateService: NavigationStateService,
    routeService: RouteService,
  ) {
    this.logger = new Logger('RerouteService');
    this.navigationStateService = navigationStateService;
    this.routeService = routeService;

    this.navigationStateService.emitter.on(
      'NAVIGATION_STATE_CHANGED',
      this.onNavigationStateChange.bind(this),
    );
  }

  onNavigationStateChange(event: NavigationStateChangedEvent) {
    if (!this.rerouting) {
      return;
    }

    const navigationState = event.payload.state;

    if (navigationState == null) {
      return;
    }

    if (navigationState.shouldReRoute) {
      this.logger.log('Re-routing');
      this.rerouting = true;
      // void this.routeService.generateDirections();
    }
  }
}
