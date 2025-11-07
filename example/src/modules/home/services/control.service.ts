import {StateService} from './state.service';
import {UserLocationService} from '../../../lib/modules/user-location';
import {BottomSheetService} from './bottom-sheet.service';
import {CameraService} from '../../../lib/modules/camera';
import {KeyboardService} from './keyboard.service.ts';

export class ControlService {
  useLocationService: UserLocationService;
  cameraService: CameraService;

  keyboardService: KeyboardService;
  stateService: StateService;
  bottomSheetService: BottomSheetService;

  constructor() {
    this.useLocationService = new UserLocationService();
    this.cameraService = new CameraService(this.useLocationService);

    this.keyboardService = new KeyboardService();
    this.stateService = new StateService();
    this.bottomSheetService = new BottomSheetService(
      this.cameraService,
      this.keyboardService,
    );
  }
}
