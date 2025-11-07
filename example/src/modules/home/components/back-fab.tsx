import type {FunctionComponent, PropsWithChildren} from 'react';
import React from 'react';
import {ArrowLeft, ChevronLeft} from 'lucide-react-native';
import {HomeService} from '../services/home.service.ts';
import {Icon} from '../../../components/icon.tsx';

export type BackFabProps = PropsWithChildren<{}>;

export const BackFab: FunctionComponent<BackFabProps> = props => {
  const {} = props;

  const {control} = HomeService.useState();

  const onBackPress = () => {
    control.stateService.goBack();
  };

  return (
    <Icon shape={'rounded'} size={'sm'} onPress={onBackPress}>
      <ArrowLeft />
    </Icon>
  );
};
