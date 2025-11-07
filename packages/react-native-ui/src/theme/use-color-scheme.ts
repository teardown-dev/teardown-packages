import { useColorScheme as useNativewindColorScheme } from "nativewind";

export function useColorScheme() {
	const { colorScheme, setColorScheme: setNativeWindColorScheme } =
		useNativewindColorScheme();

	const setColorScheme = async (colorScheme: "light" | "dark") => {
		setNativeWindColorScheme(colorScheme);
	};

	const toggleColorScheme = () => {
		return setColorScheme(colorScheme === "light" ? "dark" : "light");
	};

	return {
		colorScheme: colorScheme ?? "dark",
		isDarkColorScheme: colorScheme === "dark",
		setColorScheme,
		toggleColorScheme,
		tokens: {
			color: {
				action: {
					primary: {
						foreground: {
							dark: "#000",
						},
					},
					secondary: {
						foreground: {
							dark: "#000",
						},
					},
				},
				foreground: {
					default: {
						dark: "#000",
					},
				},
				interactive: {
					default: {
						foreground: {
							dark: "#000",
						},
					},
				},
			},
		},
	};
}
