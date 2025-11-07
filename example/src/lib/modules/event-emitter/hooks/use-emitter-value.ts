import {EventEmitter, Events} from '../event-emitter.ts';
import {useEffect, useState} from 'react';

export const useEmitterValue = <
  EmitterEvents extends Events<any>,
  Key extends keyof EmitterEvents,
  Value extends EmitterEvents[Key]['payload'],
>(
  emitter: EventEmitter<EmitterEvents>,
  key: Key,
  defaultValue: Value | null = null,
) => {
  const [value, setValue] = useState<Value | null>(defaultValue);

  useEffect(() => {
    const listener = emitter.on(key, ({payload}) => {
      setValue(payload);
    });

    return () => {
      listener.remove();
    };
  }, [emitter, key]);

  return value;
};
