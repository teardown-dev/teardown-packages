import {
  BaseEventEmitterEvent,
  EventEmitter,
  Events,
} from '../../../lib/modules/event-emitter';
import {GeoJSON} from 'geojson';

export type StateRequired<Type = string> = {
  type: Type;
};

export type StateType<State extends StateRequired> = State;

export type SearchState = StateType<{
  type: 'SEARCH';
  query: string;
}>;
export type RouteBuilderState = StateType<{
  type: 'ROUTE_BUILDER';
  waypoints: GeoJSON.Position[];
}>;
export type NavigationState = StateType<{type: 'NAVIGATION'}>;

export type StateValidator<
  T extends {
    type: string;
  },
> = T;
export type State = StateValidator<
  SearchState | RouteBuilderState | NavigationState
>;

export type History = {
  state: State;
};

export type HistoryChangedEvent = BaseEventEmitterEvent<
  'HISTORY_STATE_CHANGED',
  {
    history: History[];
  }
>;

export type StateEvents = Events<{
  HISTORY_STATE_CHANGED: HistoryChangedEvent;
}>;

export class StateService {
  emitter = new EventEmitter<StateEvents>();

  private history: History[] = [
    {
      state: {
        type: 'SEARCH',
        query: '',
      },
    },
  ];

  constructor() {}

  setHistory(history: History[]) {
    this.history = history;
    this.emitter.emit('HISTORY_STATE_CHANGED', {history});
  }

  getHistory() {
    return this.history;
  }

  getCurrentState() {
    return this.history[this.history.length - 1];
  }

  navigate(state: State) {
    this.setHistory([...this.history, {state}]);
  }

  goBack() {
    const history = this.history.slice(0, this.history.length - 1);
    this.setHistory(history);
  }
}
