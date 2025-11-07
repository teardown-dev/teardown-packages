import './theme';
import type {FunctionComponent} from 'react';
import React from 'react';
import {Main} from './main';
import './teardown.client';

export const App: FunctionComponent = () => {
  return <Main />;
};
//
// const Visual: FunctionComponent = () => {
//   return (
//     <GestureHandlerRootView className={'flex-1 bg-white'}>
//       <SafeAreaProvider>
//         <PortalProvider>
//           <BottomSheetModalProvider>
//             <NavigationContainer>
//               <Main />
//             </NavigationContainer>
//           </BottomSheetModalProvider>
//         </PortalProvider>
//       </SafeAreaProvider>
//     </GestureHandlerRootView>
//   );
// };
