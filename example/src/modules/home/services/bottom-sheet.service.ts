import {BottomSheet} from '../../../components/bottom-sheet.tsx';
import {createRef} from 'react';
import {
  BaseEventEmitterEvent,
  EventEmitter,
  Events,
} from '../../../lib/modules/event-emitter';
import {Keyboard, LayoutChangeEvent, LayoutRectangle} from 'react-native';
import {CameraService} from '../../../lib/modules/camera';
import {KeyboardEvent} from 'react-native/Libraries/Components/Keyboard/Keyboard';
import {
  KeyboardService,
  KeyboardStateChangedEvent,
} from './keyboard.service.ts';

export type BottomSheetLayoutChangedEvent = BaseEventEmitterEvent<
  'BOTTOM_SHEET_LAYOUT_CHANGED',
  {
    previousLayout: LayoutRectangle | null;
    newLayout: LayoutRectangle;
  }
>;

export type BottomSheetEvents = Events<{
  BOTTOM_SHEET_LAYOUT_CHANGED: BottomSheetLayoutChangedEvent;
}>;

export class BottomSheetService {
  private cameraService: CameraService;
  private keyboardService: KeyboardService;

  emitter = new EventEmitter<BottomSheetEvents>();

  bottomSheetRef = createRef<BottomSheet>();

  private layout: LayoutRectangle | null = null;

  constructor(cameraService: CameraService, keyboardService: KeyboardService) {
    this.cameraService = cameraService;
    this.keyboardService = keyboardService;
    this.emitter.on(
      'BOTTOM_SHEET_LAYOUT_CHANGED',
      this.onLayoutChanged.bind(this),
    );

    this.keyboardService.emitter.on(
      'KEYBOARD_STATE_CHANGED',
      this.onKeyboardChange,
    );
  }

  setLayout(newLayout: LayoutRectangle) {
    const previousLayout = this.layout;
    this.layout = newLayout;
    this.emitter.emit('BOTTOM_SHEET_LAYOUT_CHANGED', {
      previousLayout,
      newLayout,
    });
  }

  getLayout() {
    return this.layout;
  }

  onLayout = (event: LayoutChangeEvent) => {
    this.setLayout(event.nativeEvent.layout);
  };

  private onLayoutChanged(event: BottomSheetLayoutChangedEvent) {
    const {payload} = event;

    // this.cameraService.setCamera({
    //   padding: {
    //     paddingBottom: 24 + payload.newLayout.height,
    //   },
    // });
  }

  private onKeyboardChange = (event: KeyboardStateChangedEvent) => {
    const {payload} = event;
    const {state} = payload;

    console.log('onKeyboardChange', state);

    if (this.layout == null) {
      return;
    }

    // const height = state.event?.endCoordinates.height ?? 0;
    // const multiplier = state.isKeyboardShown ? 1 : -1;
    //
    // const newHeight = this.layout.height + height * multiplier;
    //
    // console.log('newHeight', newHeight);
    //
    // this.setLayout({
    //   ...this.layout,
    //   height: newHeight,
    // });
  };
}
