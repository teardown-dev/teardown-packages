import {
  ParamListBase,
  useNavigation as useDefaultNavigation,
} from '@react-navigation/native';
import {NavigationStackParamList} from './navigation.tsx';
import {StackNavigationProp} from '@react-navigation/stack';

export const useNavigation = <
  T extends ParamListBase = NavigationStackParamList,
>() => {
  return useDefaultNavigation<StackNavigationProp<T>>();
};
