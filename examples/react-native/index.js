import { AppRegistry } from "react-native";
import { name as appName } from "./app.json";
import App from "./src/app";
// import teardownClient from "./teardown.client";

// teardownClient.start();

AppRegistry.registerComponent(appName, () => App);
