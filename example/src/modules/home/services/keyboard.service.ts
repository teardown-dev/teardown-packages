import {
  BaseEventEmitterEvent,
  EventEmitter,
  Events,
} from '../../../lib/modules/event-emitter';
import {Keyboard} from 'react-native';
import {KeyboardEvent} from 'react-native/Libraries/Components/Keyboard/Keyboard';

export type KeyboardState = {
  isKeyboardShown: boolean;
  event: KeyboardEvent | null;
};

export type KeyboardStateChangedEvent = BaseEventEmitterEvent<
  'KEYBOARD_STATE_CHANGED',
  {
    state: KeyboardState;
  }
>;

export type BottomSheetEvents = Events<{
  KEYBOARD_STATE_CHANGED: KeyboardStateChangedEvent;
}>;

export class KeyboardService {
  emitter = new EventEmitter<BottomSheetEvents>();

  private state: KeyboardState = {
    isKeyboardShown: false,
    event: null,
  };

  constructor() {
    Keyboard.addListener(
      'keyboardWillChangeFrame',
      this.onKeyboardWillChangeFrame.bind(this),
    );
  }

  onKeyboardWillChangeFrame(event: KeyboardEvent) {
    const currentState = this.state;

    const previousScreenY = currentState.event?.endCoordinates.screenY ?? 0;
    // console.log('previousScreenY', previousScreenY);
    const newScreenY = event.endCoordinates.screenY;
    // console.log('newScreenY', newScreenY);

    const isKeyboardShown =
      previousScreenY === 0 ? true : newScreenY > previousScreenY;

    // console.log('previousScreenY', previousScreenY);
    // console.log('newScreenY', newScreenY);
    // console.log('isKeyboardShown', isKeyboardShown);

    this.emitter.emit('KEYBOARD_STATE_CHANGED', {
      state: {
        isKeyboardShown,
        event,
      },
    });
  }

  setState(state: KeyboardState) {
    this.state = state;
    this.emitter.emit('KEYBOARD_STATE_CHANGED', {
      state,
    });
  }
}
