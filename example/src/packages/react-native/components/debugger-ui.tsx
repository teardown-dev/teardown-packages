import {FunctionComponent, useRef, useState} from 'react';
import {
  DevSettings,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {EdgeInsets, useSafeAreaInsets} from 'react-native-safe-area-context';
import {TeardownLogo} from './teardown-logo.tsx';
import {useEmitterValue} from '@teardown/event-emitter';
import {Debugger, DebuggerStatus, TeardownService} from '../services';
import {TeardownClient} from '../teardown.client';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  BottomSheet,
  BottomSheetCloseIcon,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetTitle,
  BottomSheetView,
} from '../../../components/bottom-sheet.tsx';
import {BottomSheetHandleProps} from '@gorhom/bottom-sheet';
import {Button} from '../../ui/components/button.tsx';

export type DebuggerUiPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center-left'
  | 'center-right';

export type DebuggerUiOptions = {
  enabled?: boolean;
  position?: DebuggerUiPosition;
};

export const DebuggerUi: FunctionComponent<DebuggerUiOptions> = props => {
  const {enabled = true} = props;
  const {client} = TeardownService.useState();

  const clientDebugger = client.debugger;

  if (!__DEV__ || clientDebugger == null) {
    // never render the debugger ui in any mode apart from __DEV__ == true "development"
    return null;
  }

  const isNotEnabled = !enabled;

  if (isNotEnabled) {
    return null;
  }

  return (
    <DebuggerUiEnabled
      {...props}
      client={client}
      clientDebugger={clientDebugger}
    />
  );
};

const DebuggerUiEnabled: FunctionComponent<
  DebuggerUiOptions & {
    client: TeardownClient;
    clientDebugger: Debugger;
  }
> = props => {
  const {clientDebugger, position} = props;

  const safeAreaInsets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <>
      <View style={styles.container} pointerEvents={'box-none'}>
        <GestureHandlerRootView>
          <BottomSheetModalProvider>
            <Pressable
              onPress={() => {
                // bottomSheetRef.current?.snapToIndex(0);
              }}
              style={[
                styles.orb,
                getOrbPosition(safeAreaInsets, position ?? 'center-right'),
              ]}>
              <TeardownLogo height={20} width={20} />
            </Pressable>

            <BottomSheet
              sheetRef={bottomSheetRef}
              handleComponent={handleProps => (
                <DebuggerStatusHandleComponent
                  {...handleProps}
                  clientDebugger={clientDebugger}
                />
              )}>
              <BottomSheetCloseIcon />
              <BottomSheetView
                className={''}
                style={{
                  paddingBottom: safeAreaInsets.bottom + 16,
                }}>
                <BottomSheetHeader>
                  <BottomSheetTitle>Debugger</BottomSheetTitle>
                </BottomSheetHeader>
                <BottomSheetContent>
                  <Button
                    onPress={() => {
                      DevSettings.reload('Teardown reconnect');
                    }}>
                    Reconnect debugger
                  </Button>
                </BottomSheetContent>
              </BottomSheetView>
            </BottomSheet>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>

        {/*<View style={styles.half_height}>*/}
        {/*    */}
        {/*</View>*/}
      </View>
    </>
  );
};

const DebuggerStatusHandleComponent: FunctionComponent<
  BottomSheetHandleProps & {
    clientDebugger: Debugger;
  }
> = ({clientDebugger}) => {
  const debuggerStatus = useEmitterValue(
    clientDebugger.emitter,
    'DEBUGGER_STATUS_CHANGED',
    {
      status: clientDebugger.getStatus(),
    },
  );

  return (
    <View
      style={[
        {
          backgroundColor: getColorForDebuggerStatus(
            debuggerStatus?.status ?? null,
          ),
        },
        styles.debugger_status,
      ]}>
      <Text style={styles.debugger_status_text}>{debuggerStatus?.status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  debugger_status: {
    flex: 1,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 4,
  },
  debugger_status_text: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  },
  orb: {
    height: 40,
    width: 40,
    backgroundColor: 'hsl(240 5% 6%)',
    borderRadius: 40,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  half_height: {
    height: '50%',
    backgroundColor: '#e1e1e1',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  logo: {
    height: 20,
    width: 20,
  },
});

const getColorForDebuggerStatus = (status: DebuggerStatus | null) => {
  switch (status) {
    case 'CONNECTING':
      return 'yellow';
    case 'CONNECTED':
      return 'green';
    case 'DISCONNECTED':
      return 'red';
    case 'FAILED':
      return 'red';
    default:
      return 'gray';
  }
};

const getOrbPosition = (
  edgeInsets: EdgeInsets,
  position: DebuggerUiPosition,
): ViewStyle => {
  const DEFAULT_PADDING = 16;
  switch (position) {
    case 'top-left':
      return {
        top: DEFAULT_PADDING + edgeInsets.top,
        left: DEFAULT_PADDING,
      };
    case 'top-right':
      return {
        top: DEFAULT_PADDING + edgeInsets.top,
        right: DEFAULT_PADDING,
      };
    case 'bottom-left':
      return {
        bottom: DEFAULT_PADDING + edgeInsets.bottom,
        left: DEFAULT_PADDING,
      };
    case 'bottom-right':
      return {
        bottom: DEFAULT_PADDING + edgeInsets.bottom,
        right: DEFAULT_PADDING,
      };
    case 'center-left':
      return {
        top: '50%',
        left: DEFAULT_PADDING,
      };
    case 'center-right':
      return {
        top: '50%',
        right: DEFAULT_PADDING,
      };
  }
};
