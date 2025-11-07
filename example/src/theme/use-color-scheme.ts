import {useColorScheme as useNativewindColorScheme} from 'nativewind';

import {COLORS} from './colors';

export function useColorScheme() {

  const {colorScheme, setColorScheme: setNativeWindColorScheme} =
    useNativewindColorScheme();

  const setColorScheme = async (colorScheme: 'light' | 'dark') => {
    setNativeWindColorScheme(colorScheme);
  };

  const toggleColorScheme = () => {
    return setColorScheme(colorScheme === 'light' ? 'dark' : 'light');
  };

  return {
    colorScheme: colorScheme ?? 'dark',
    isDarkColorScheme: colorScheme === 'dark',
    setColorScheme,
    toggleColorScheme,
    colors: COLORS[colorScheme ?? 'dark'],
  };
}
