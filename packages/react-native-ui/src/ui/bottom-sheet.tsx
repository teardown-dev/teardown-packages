import React, {
	createContext,
	type FunctionComponent,
	type PropsWithChildren,
	type RefObject,
	useImperativeHandle,
	useRef,
} from "react";
import GorhomBottomSheet, {
	BottomSheetModalProvider,
	BottomSheetFlatList as GorhomBottomSheetFlatList,
	BottomSheetModal as GorhomBottomSheetModal,
	type BottomSheetModalProps as GorhomBottomSheetModalProps,
	type BottomSheetProps as GorhomBottomSheetProps,
	BottomSheetView as GorhomBottomSheetView,
	BottomSheetBackdrop,
	type BottomSheetHandleProps,
	BottomSheetHandle,
} from "@gorhom/bottom-sheet";
import { cn } from "../theme";
// import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { X } from "lucide-react-native";
import { Icon } from "./icon";
import { Text, type TextProps, View, type ViewProps } from "react-native";
import type { BottomSheetViewProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetView/types";
import type { BottomSheetFlatListProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types";
import { useKeyboard } from "../hooks/use-keyboard";

export { BottomSheetModalProvider, BottomSheetHandle };
export type { BottomSheetHandleProps };

type BottomSheetContextType<T extends BottomSheet | BottomSheetModal> = {
	bottomSheetRef: React.RefObject<T>;
};

const BottomSheetContext = createContext<BottomSheetContextType<any> | null>(
	null,
);

export const useBottomSheetContext = <
	T extends BottomSheet | BottomSheetModal,
>() => {
	const context = React.useContext(
		BottomSheetContext,
	) as BottomSheetContextType<T> | null;

	if (context === null) {
		throw new Error(
			"useBottomSheetContext must be used within a BottomSheetProvider",
		);
	}

	return context;
};

export type BottomSheet = GorhomBottomSheet;

export type BottomSheetProps = PropsWithChildren<GorhomBottomSheetProps> & {
	sheetRef?: React.RefObject<BottomSheet>;
};

export const BottomSheet: FunctionComponent<BottomSheetProps> = (props) => {
	const { children, sheetRef, ...otherProps } = props;

	// const {tokens} = useColorScheme();
	// const safeArea = useSafeAreaInsets();

	const ref = useRef<BottomSheet>(null);
	useImperativeHandle(sheetRef, () => ref.current!);

	return (
		<GorhomBottomSheet
			ref={ref}
			// topInset={safeArea.top}
			enableDynamicSizing
			keyboardBehavior="interactive"
			keyboardBlurBehavior={"restore"}
			backdropComponent={BottomSheetBackdrop}
			handleIndicatorStyle={{
				// backgroundColor: tokens.color.foreground.default.dark, // TODO fix
				width: 64,
			}}
			backgroundStyle={
				{
					// backgroundColor: tokens.color.surface.default.dark, // TODO fix
				}
			}
			{...otherProps}
		>
			<BottomSheetContext.Provider value={{ bottomSheetRef: ref }}>
				{children}
			</BottomSheetContext.Provider>
		</GorhomBottomSheet>
	);
};
export type BottomSheetModal = GorhomBottomSheetModal;

export type BottomSheetModalProps =
	PropsWithChildren<GorhomBottomSheetModalProps> & {
		sheetRef?: RefObject<BottomSheetModal>;
	};

export const useModalRef = () => {
	return useRef<BottomSheetModal>(null);
};

export const BottomSheetModal: FunctionComponent<BottomSheetModalProps> = (
	props,
) => {
	const { children, sheetRef, ...otherProps } = props;

	// const {tokens} = useColorScheme(); // TODO fix
	// const safeArea = useSafeAreaInsets();

	const ref = useRef<BottomSheetModal>(null);
	useImperativeHandle(sheetRef, () => ref.current!);

	return (
		<GorhomBottomSheetModal
			ref={ref}
			enableDynamicSizing
			keyboardBehavior="interactive"
			keyboardBlurBehavior={"restore"}
			// topInset={safeArea.top}
			backdropComponent={(backdropProps) => (
				<BottomSheetBackdrop
					opacity={0.6}
					disappearsOnIndex={-1}
					appearsOnIndex={0}
					enableTouchThrough={false}
					// style={tw`bg-black absolute w-full h-full`} // TODO fix ?
					{...backdropProps}
				/>
			)}
			handleIndicatorStyle={{
				// backgroundColor: tokens.color.foreground.default.dark, // TODO fix
				width: 64,
			}}
			backgroundStyle={
				{
					// backgroundColor: tokens.color.surface.default.dark, // TODO fix
				}
			}
			{...otherProps}
		>
			<BottomSheetContext.Provider value={{ bottomSheetRef: ref }}>
				{children}
			</BottomSheetContext.Provider>
		</GorhomBottomSheetModal>
	);
};

export const BottomSheetView: FunctionComponent<BottomSheetViewProps> = (
	props,
) => {
	const { children, ...otherProps } = props;
	// const safeArea = useSafeAreaInsets();

	return (
		<GorhomBottomSheetView {...otherProps}>
			{children}
			<View
				style={{
					width: "100%",
					// height: safeArea.bottom,
				}}
			/>
		</GorhomBottomSheetView>
	);
};

export function BottomSheetFlatList<T>(props: BottomSheetFlatListProps<T>) {
	const { ...otherProps } = props;

	const [keyboardShown] = useKeyboard();
	// const safeArea = useSafeAreaInsets();

	return (
		<>
			<GorhomBottomSheetFlatList
				contentContainerStyle={
					{
						// paddingBottom: keyboardShown ? 0 : safeArea.bottom,
					}
				}
				{...otherProps}
			/>
		</>
	);
}

export const BottomSheetCloseIcon: FunctionComponent<{
	onPress?: () => void;
}> = ({ onPress }) => {
	const bottomSheet = useBottomSheetContext();

	const onClosePress = () => {
		bottomSheet.bottomSheetRef.current?.close();
	};

	return (
		<Icon
			className={"absolute top-4 right-4 z-50"}
			size={"sm"}
			onPress={onPress ?? onClosePress}
		>
			<X />
		</Icon>
	);
};

export const BottomSheetHeader = ({ className, ...props }: ViewProps) => (
	<View
		className={cn(
			"flex flex-col space-y-2 text-center sm:text-left py-5 px-6",
			className,
		)}
		{...props}
	/>
);
BottomSheetHeader.displayName = "BottomSheetHeader";

export const BottomSheetTitle: FunctionComponent<TextProps> = ({
	className,
	...props
}) => (
	<Text
		className={cn("text-2xl font-semibold text-foreground", className)}
		{...props}
	/>
);
BottomSheetTitle.displayName = "BottomSheetTitle";

export const BottomSheetDescription: FunctionComponent<TextProps> = ({
	className,
	...props
}) => (
	<Text className={cn("text-muted-foreground text-md", className)} {...props} />
);
BottomSheetDescription.displayName = "BottomSheetDescription";

export const BottomSheetContent = ({ className, ...props }: ViewProps) => (
	<View className={cn("flex flex-col space-y-4 p-6", className)} {...props} />
);
BottomSheetContent.displayName = "BottomSheetContent";
