import { Util } from "@teardown/util";

export type BaseEventEmitterEvent<
	Type,
	Payload extends Record<string, any> = object,
> = {
	event_id: string;
	timestamp: number;
	type: Type;
	payload: Payload;
};

export type Events<EmitterEvents extends Record<string, any>> = {
	[Type in keyof EmitterEvents]: BaseEventEmitterEvent<
		Type,
		EmitterEvents[Type]["payload"]
	>;
};

export type EventHandler<Event extends BaseEventEmitterEvent<any, any>> = (
	event: Event,
) => void;

export type ListenerHandler<Event extends BaseEventEmitterEvent<any, any>> = (
	event: Event,
) => void | Promise<void>;

export type Listener = {
	id: string;
	remove: () => void;
};

export class EventEmitter<EmitterEvents extends Events<any>> {
	private listeners: {
		[Type in keyof EmitterEvents]?: {
			[listenerId: string]: EventHandler<
				BaseEventEmitterEvent<Type, EmitterEvents[Type]["payload"]>
			>;
		};
	} & {
		all: {
			[listenerId: string]: EventHandler<
				BaseEventEmitterEvent<keyof EmitterEvents, EmitterEvents>
			>;
		};
	} = {
		all: {},
	};

	onAll(
		listener: ListenerHandler<
			BaseEventEmitterEvent<keyof EmitterEvents, EmitterEvents>
		>,
	) {
		const listenerId = Util.generateUUID();
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

	on<
		Type extends keyof EmitterEvents,
		Payload extends EmitterEvents[Type]["payload"],
	>(
		type: Type,
		listener: ListenerHandler<BaseEventEmitterEvent<Type, Payload>>,
	): Listener {
		if (!this.listeners[type]) {
			// TODO fix up type - maybe move to event emitter v3
			// @ts-ignore
			this.listeners[type] = {};
		}
		const listenerId = Util.generateUUID();
		// TODO fix up type - maybe move to event emitter v3
		// @ts-ignore
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

	emit<
		Type extends keyof EmitterEvents,
		Payload extends EmitterEvents[Type]["payload"],
	>(type: Type, payload: Payload) {
		const event: BaseEventEmitterEvent<Type, Payload> = {
			event_id: Util.generateUUID(),
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
