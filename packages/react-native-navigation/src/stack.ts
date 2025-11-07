import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import type { EventMapBase } from "@react-navigation/core/src/types.tsx";
import type { DrawerNavigationOptions } from "@react-navigation/drawer";
import type { TypedNavigator } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { NavigationState, ParamListBase } from "@react-navigation/routers";
import type { StackNavigationOptions } from "@react-navigation/stack";
import type * as React from "react";
import type { FunctionComponent, ReactNode } from "react";

export type Stack<
	ScreenOptions extends
		| NativeStackNavigationOptions
		| StackNavigationOptions
		| DrawerNavigationOptions
		| BottomTabNavigationOptions,
	ParamList extends ParamListBase,
	State extends NavigationState,
	EventMap extends EventMapBase,
	Navigator extends React.ComponentType<any>,
> = {
	name: string;
	stack: TypedNavigator<ParamList, State, ScreenOptions, EventMap, Navigator>;
	layout?: FunctionComponent<{ children: ReactNode }>;
	options?: ScreenOptions;
};

export type AnyStack = Stack<any, any, any, any, any>;

export type CreateStackOptions<
	ScreenOptions extends
		| NativeStackNavigationOptions
		| StackNavigationOptions
		| DrawerNavigationOptions
		| BottomTabNavigationOptions,
	ParamList extends ParamListBase,
	State extends NavigationState,
	EventMap extends EventMapBase,
	Navigator extends React.ComponentType<any>,
> = Stack<ScreenOptions, ParamList, State, EventMap, Navigator>;

export const createStack = <
	ScreenOptions extends
		| NativeStackNavigationOptions
		| StackNavigationOptions
		| DrawerNavigationOptions
		| BottomTabNavigationOptions,
	ParamList extends ParamListBase = any,
	State extends NavigationState<ParamList> = any,
	EventMap extends EventMapBase = any,
	Navigator extends React.ComponentType<any> = any,
>(
	options: CreateStackOptions<
		ScreenOptions,
		ParamList,
		State,
		EventMap,
		Navigator
	>,
): Stack<ScreenOptions, ParamList, State, EventMap, Navigator> => {
	return options;
};
