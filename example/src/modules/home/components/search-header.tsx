import {FunctionComponent, PropsWithChildren, useState} from 'react';
import React from 'react';
import {View} from 'react-native';
import {Input} from '../../../components/input.tsx';
import {ArrowRight, List, Search} from 'lucide-react-native';
import {Icon} from '../../../components/icon.tsx';
import {MotiView} from 'moti';
import {Skeleton} from 'moti/skeleton';

export type SearchHeaderProps = PropsWithChildren<{}>;

export const SearchHeader: FunctionComponent<SearchHeaderProps> = props => {
  const {} = props;

  const [isFocused, focusProps] = useFocus();

  return (
    <View>
      <View className={'p-4 flex-row gap-2'}>
        <View className={'flex-1'}>
          <Input
            {...focusProps}
            inBottomSheet
            leftIcon={<Search color={'white'} size={24} />}
            placeholder={'Search'}
          />
        </View>
        {!isFocused ? (
          <Icon
            onPress={() => {
              // toursBottomSheet.current?.present();
            }}>
            <List />
          </Icon>
        ) : (
          <Icon
            onPress={() => {
              // toursBottomSheet.current?.present();
            }}>
            <ArrowRight />
          </Icon>
        )}
      </View>
    </View>
  );
};

const useFocus = (): [
  boolean,
  {
    onFocus: () => void;
    onBlur: () => void;
  },
] => {
  const [isFocused, setIsFocused] = useState(false);

  const onFocus = () => setIsFocused(true);
  const onBlur = () => setIsFocused(false);

  return [isFocused, {onFocus, onBlur}];
};
