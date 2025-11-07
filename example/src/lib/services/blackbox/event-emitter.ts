import { v4 as uuid } from "uuid";

import {
  EventTypes,
  EventEmitterEvent as ClientEventEmitterEvent,
  EventEmitterEventPayloads,
} from "./event.types";

export type EventEmitterEvent<
  Type extends EventTypes,
  Payload extends Record<string, any>,
> = ClientEventEmitterEvent<Type, Payload>;

export type EventHandler<Event extends EventEmitterEvent<any, any>> = (
  event: Event,
) => void;

export type ListenerHandler<Event extends EventEmitterEvent<any, any>> = (
  event: Event,
) => void | Promise<void>;

export type Listener = {
  id: string;
  remove: () => void;
};

export class EventEmitter {
  private listeners: {
    [Type in EventTypes]?: {
      [listenerId: string]: EventHandler<EventEmitterEvent<Type, any>>;
    };
  } & {
    all: {
      [listenerId: string]: EventHandler<EventEmitterEvent<any, any>>;
    };
  } = {
    all: {},
  };

  onAll(listener: ListenerHandler<EventEmitterEvent<any, any>>) {
    const listenerId = uuid();
    this.listeners.all = {
      ...(this.listeners.all ?? {}),
      [listenerId]: listener,
    };

    return {
      id: listenerId,
      remove: () => {
        if (this.listeners.all) {
          delete this.listeners.all?.[listenerId];
        }
      },
    };
  }

  on<Type extends EventTypes>(
    type: Type,
    listener: ListenerHandler<
      EventEmitterEvent<Type, EventEmitterEventPayloads[Type]>
    >,
  ): Listener {
    if (!this.listeners[type]) {
      this.listeners[type] = {};
    }
    const listenerId = uuid();
    this.listeners[type] = {
      ...(this.listeners[type] ?? {}),
      [listenerId]: listener,
    };

    return {
      id: listenerId,
      remove: () => {
        if (this.listeners[type]) {
          delete this.listeners[type]?.[listenerId];
        }
      },
    };
  }

  emit<Type extends EventTypes>(
    type: Type,
    payload: EventEmitterEventPayloads[Type],
  ): void {
    const event: EventEmitterEvent<any, any> = {
      timestamp: Date.now(),
      type,
      payload,
    };

    const allListeners = Object.values(this.listeners.all);
    if (allListeners.length !== 0) {
      Object.values(allListeners).forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(err);
        }
      });
    }

    const listeners = this.listeners[type];

    if (listeners != null) {
      Object.values(listeners).forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(err);
        }
      });
    }
  }

  removeAllListeners(): void {
    this.listeners = {
      all: {},
    };
  }
}
