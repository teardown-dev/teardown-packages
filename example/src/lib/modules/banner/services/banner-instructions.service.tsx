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
} from '../../../assets/tsx';
import React from 'react';
import {BannerInstruction, Maneuver} from '../../mapbox';

export class BannerInstructionsService {
  constructor() {}

  getIconForBannerInstruction(bannerInstruction: BannerInstruction) {
    switch (bannerInstruction.primary.type) {
      case 'turn':
        return this.getIconForTurnDirection(bannerInstruction.primary.modifier);
      case 'merge':
        return this.getIconForMergeDirection(
          bannerInstruction.primary.modifier,
        );
      case 'depart':
        return this.getIconForDepartDirection(
          bannerInstruction.primary.modifier,
        );
      case 'arrive':
        return this.getIconForArriveDirection(
          bannerInstruction.primary.modifier,
        );
      case 'fork':
        return this.getIconForForkDirection(bannerInstruction.primary.modifier);
      case 'off ramp':
        return this.getIconForOffRampDirection(
          bannerInstruction.primary.modifier,
        );
      case 'roundabout':
        return this.getIconForRoundaboutDirection(
          bannerInstruction.primary.modifier,
        );
      default:
        return null;
    }
  }
  private getIconForTurnDirection(turnDirection: Maneuver['modifier']) {
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
  }
  private getIconForMergeDirection(mergeDirection: Maneuver['modifier']) {
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
  }
  private getIconForDepartDirection(departDirection: Maneuver['modifier']) {
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
  }
  private getIconForArriveDirection(arriveDirection: Maneuver['modifier']) {
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
  }
  private getIconForForkDirection(forkDirection: Maneuver['modifier']) {
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
  }
  private getIconForOffRampDirection(offRampDirection: Maneuver['modifier']) {
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
  }

  private getIconForRoundaboutDirection(
    roundaboutDirection: Maneuver['modifier'],
  ) {
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
  }
}
