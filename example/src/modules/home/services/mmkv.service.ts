import {MMKV} from 'react-native-mmkv';

export class MmkvService extends MMKV {
  id: string;

  constructor(id: string) {
    super({
      id,
    });
    this.id = id;
  }
}
