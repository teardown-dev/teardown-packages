import {
  BaseEventEmitterEvent,
  EventEmitter,
  Events,
} from '../../../lib/modules/event-emitter';
import {State, StateChangedEvent, StateService} from './state.service.ts';

export type History = {
  state: State;
};

export type HistoryChangedEvent = BaseEventEmitterEvent<
  'HISTORY_STATE_CHANGED',
  {
    history: History[];
  }
>;

export type BannerEvents = Events<{
  HISTORY_STATE_CHANGED: HistoryChangedEvent;
}>;

export class StateHistoryService {
  emitter = new EventEmitter<BannerEvents>();

  private stateService: StateService;

  private history: History[] = [];

  constructor(stateService: StateService) {
    this.stateService = stateService;

    this.stateService.emitter.on(
      'STATE_CHANGED',
      this.onStateChanged.bind(this),
    );
  }

  setHistory(history: History[]) {
    this.history = history;
    this.emitter.emit('HISTORY_STATE_CHANGED', {history});
  }

  getHistory() {
    return this.history;
  }

  onStateChanged(event: StateChangedEvent) {
    const {payload} = event;
    const {state, direction} = payload;

    switch (direction) {
      case 'FORWARD': {
        this.onStateChangedForward(state);
        break;
      }
      case 'BACKWARD': {
        this.onStateChangedBackward();
      }
    }
  }

  onStateChangedForward(state: State) {
    const newHistory: History = {
      state,
    };

    const newHistoryState = this.history.concat(newHistory);

    this.setHistory(newHistoryState);
  }

  onStateChangedBackward() {
    const newHistoryState = this.history.slice(0, -1);
    this.setHistory(newHistoryState);
  }
}
