import {
  BannerInstruction,
  Maneuver,
  Route,
  VoiceInstruction,
} from '@mapbox/mapbox-sdk/services/directions';
// import * as Speech from "expo-speech";
import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';
import {View} from 'react-native';

import {
  Arrive,
  ArriveLeft,
  ArriveRight,
  ArriveStraight,
  ContinueStraight,
  Depart,
  Fork,
  ForkLeft,
  ForkRight,
  ForkSlightLeft,
  ForkSlightRight,
  ForkStraight,
  MergeLeft,
  MergeRight,
  MergeSlightLeft,
  MergeSlightRight,
  MergeStraight,
  OffRampLeft,
  OffRampRight,
  OffRampSlightLeft,
  OffRampSlightRight,
  Roundabout,
  RoundaboutLeft,
  RoundaboutRight,
  RoundaboutSharpLeft,
  RoundaboutSharpRight,
  RoundaboutSlightLeft,
  RoundaboutSlightRight,
  RoundaboutStraight,
  TurnLeft,
  TurnRight,
  TurnSharpLeft,
  TurnSharpRight,
  TurnSlightLeft,
  TurnSlightRight,
  Uturn,
} from '../assets/tsx';
import {NavigationService} from '../services/navigation.service';

export type BannerInstructionsProps = PropsWithChildren<{
  navigationService: NavigationService;
}>;

export const BannerInstructions: FunctionComponent<
  BannerInstructionsProps
> = props => {
  const {navigationService} = props;

  const [bannerInstruction, setBannerInstruction] =
    useState<BannerInstruction | null>(null);
  const [voiceInstruction, setVoiceInstruction] =
    useState<VoiceInstruction | null>(null);

  useEffect(() => {
    const directionsListener = navigationService.blackbox.emitter.on(
      'NAVIGATION_STATE_CHANGED',
      ({payload: {state}}) => {
        const navigationRoute = navigationService.blackbox.getNavigationRoute();

        if (navigationRoute == null) {
          return;
        }

        const step =
          navigationRoute.legs[state.legIndex].steps[state.stepIndex];

        if (step == null) {
          return;
        }

        const bannerInstruction = step.bannerInstructions
          .reverse()
          .find(instruction => {
            return (
              instruction.distanceAlongGeometry >= state.userDistanceToEndStep
            );
          });

        if (bannerInstruction != null) {
          setBannerInstruction(bannerInstruction);
        }

        const voiceInstruction = step.voiceInstructions
          .reverse()
          .find(instruction => {
            return (
              instruction.distanceAlongGeometry >= state.userDistanceToEndStep
            );
          });

        if (voiceInstruction != null) {
          setVoiceInstruction(voiceInstruction);
        }
      },
    );

    return () => {
      directionsListener.remove();
    };
  }, [bannerInstruction, navigationService]);

  useEffect(() => {
    if (voiceInstruction == null) {
      return;
    }

    console.log('voiceInstruction', voiceInstruction);

    // Speech.speak(voiceInstruction.announcement);
  }, [voiceInstruction]);

  if (bannerInstruction == null) {
    return null;
  }

  return (
    <View style={{}}>
      <View
        style={{
          width: 48,
          height: 48,
          padding: 12,
        }}>
        {getIconForBannerInstruction(bannerInstruction)}
      </View>
      {/*<Text style={tw`text-heading-md`}>{bannerInstruction?.primary.text}</Text>*/}
    </View>
  );
};

const getIconForBannerInstruction = (bannerInstruction: BannerInstruction) => {
  switch (bannerInstruction.primary.type) {
    case 'turn':
      return getIconForTurnDirection(bannerInstruction.primary.modifier);
    case 'merge':
      return getIconForMergeDirection(bannerInstruction.primary.modifier);
    case 'depart':
      return getIconForDepartDirection(bannerInstruction.primary.modifier);
    case 'arrive':
      return getIconForArriveDirection(bannerInstruction.primary.modifier);
    case 'fork':
      return getIconForForkDirection(bannerInstruction.primary.modifier);
    case 'off ramp':
      return getIconForOffRampDirection(bannerInstruction.primary.modifier);
    case 'roundabout':
      return getIconForRoundaboutDirection(bannerInstruction.primary.modifier);
    default:
      return null;
  }
};

const getIconForTurnDirection = (turnDirection: Maneuver['modifier']) => {
  switch (turnDirection) {
    case 'left':
      return <TurnLeft />;
    case 'right':
      return <TurnRight />;
    case 'slight left':
      return <TurnSlightLeft />;
    case 'slight right':
      return <TurnSlightRight />;
    case 'sharp left':
      return <TurnSharpLeft />;
    case 'sharp right':
      return <TurnSharpRight />;
    case 'uturn':
      return <Uturn />;
    case 'straight':
      return <ContinueStraight />;
    default:
      return null;
  }
};

const getIconForMergeDirection = (mergeDirection: Maneuver['modifier']) => {
  switch (mergeDirection) {
    case 'left':
      return <MergeLeft />;
    case 'right':
      return <MergeRight />;
    case 'slight left':
      return <MergeSlightLeft />;
    case 'slight right':
      return <MergeSlightRight />;
    case 'straight':
      return <MergeStraight />;
    default:
      return null;
  }
};

const getIconForDepartDirection = (departDirection: Maneuver['modifier']) => {
  switch (departDirection) {
    case 'left':
      return <TurnLeft />;
    case 'right':
      return <TurnRight />;
    case 'straight':
      return <ContinueStraight />;
    default:
      return <Depart />;
  }
};

const getIconForArriveDirection = (arriveDirection: Maneuver['modifier']) => {
  switch (arriveDirection) {
    case 'left':
      return <ArriveLeft />;
    case 'right':
      return <ArriveRight />;
    case 'straight':
      return <ArriveStraight />;
    default:
      return <Arrive />;
  }
};

const getIconForForkDirection = (forkDirection: Maneuver['modifier']) => {
  switch (forkDirection) {
    case 'left':
      return <ForkLeft />;
    case 'right':
      return <ForkRight />;
    case 'slight left':
      return <ForkSlightLeft />;
    case 'slight right':
      return <ForkSlightRight />;
    case 'straight':
      return <ForkStraight />;
    default:
      return <Fork />;
  }
};

const getIconForOffRampDirection = (offRampDirection: Maneuver['modifier']) => {
  switch (offRampDirection) {
    case 'left':
      return <OffRampLeft />;
    case 'right':
      return <OffRampRight />;
    case 'slight left':
      return <OffRampSlightLeft />;
    case 'slight right':
      return <OffRampSlightRight />;
    default:
      return null;
  }
};

const getIconForRoundaboutDirection = (
  roundaboutDirection: Maneuver['modifier'],
) => {
  switch (roundaboutDirection) {
    case 'left':
      return <RoundaboutLeft />;
    case 'right':
      return <RoundaboutRight />;
    case 'slight left':
      return <RoundaboutSlightLeft />;
    case 'slight right':
      return <RoundaboutSlightRight />;
    case 'sharp left':
      return <RoundaboutSharpLeft />;
    case 'sharp right':
      return <RoundaboutSharpRight />;
    case 'straight':
      return <RoundaboutStraight />;
    default:
      return <Roundabout />;
  }
};
