import { memo, useMemo, useState } from "react";
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useForceUpdate } from "@teardown/react-native";


export const FullscreenTakeover = memo(() => {

  const [isSkipped, setIsSkipped] = useState(false);
  const context = useForceUpdate();

  const handleUpdatePress = async () => {
    const url = Platform.OS === "ios" ? "https://apps.apple.com/ca/iphone/today" : "https://play.google.com/store/games?hl=en";

    const canOpenURL = await Linking.canOpenURL(url);
    if (!canOpenURL) {
      Alert.alert("Unable to open URL:", url);
      return;
    }

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleSkipPress = () => {
    setIsSkipped(true);
  };

  const handleClosePress = () => {
    setIsSkipped(true);
  };

  const showTakeover = useMemo(() => {
    return context.isUpdateRequired || context.isUpdateAvailable;
  }, [context.isUpdateRequired, context.isUpdateAvailable]);

  if (!showTakeover) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClosePress}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={styles.title}>
            Update Required
          </Text>
          <Text style={styles.message}>
            A new version of Teardown is available. Please update to continue using the app.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleUpdatePress}>
              <Text style={styles.primaryButtonText}>Update Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSkipPress}>
              <Text style={styles.secondaryButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 1000,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1001,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#1A1A1A",
    fontWeight: "300",
  },
  content: {
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(168, 230, 207, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(168, 230, 207, 0.5)",
  },
  checkmark: {
    width: 50,
    height: 50,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkStem: {
    width: 5,
    height: 28,
    backgroundColor: "#A8E6CF",
    transform: [{ rotate: "45deg" }],
    position: "absolute",
    bottom: 6,
    right: 14,
    borderRadius: 2,
  },
  checkmarkKick: {
    width: 5,
    height: 16,
    backgroundColor: "#A8E6CF",
    transform: [{ rotate: "-45deg" }],
    position: "absolute",
    bottom: 6,
    left: 14,
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 36,
  },
  message: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#2C2C2C",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  secondaryButtonText: {
    color: "#2C2C2C",
    fontSize: 16,
    fontWeight: "600",
  },
});
