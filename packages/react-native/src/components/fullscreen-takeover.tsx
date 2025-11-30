import { StyleSheet, Text, View } from "react-native";

import { useForceUpdate } from "../contexts/force-update.context";

export const FullscreenTakeover = () => {
  const { isUpdateRequired } = useForceUpdate();

  if (!isUpdateRequired) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text>FullscreenTakeover</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
});
