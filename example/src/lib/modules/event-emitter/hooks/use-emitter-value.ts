import {EventEmitter, Events} from '../event-emitter.ts';
import {useEffect, useState} from 'react';

export const useEmitterValue = <
  EmitterEvents extends Events<any>,
  Key extends keyof EmitterEvents,
  Value extends EmitterEvents[Key]['payload'],
>(
  emitter: () => EventEmitter<EmitterEvents>,
  key: Key,
  defaultValue: Value,
) => {
  const [value, setValue] = useState<Value>(defaultValue);

  useEffect(() => {
    const listener = emitter().on(key, ({payload: {state}}) => {
      setValue(state);
    });

    return () => {
      listener.remove();
    };
  }, [emitter, key]);

  return value;
};
