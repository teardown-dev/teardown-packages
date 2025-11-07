import { AppRegistry } from "react-native";
import { name as appName } from "./app.json";
import App from "./src/app";
// import teardownClient from "./teardown.client";

// teardownClient.start();

window.__REACT_DEVTOOLS_PORT__ = 9090;

AppRegistry.registerComponent(appName, () => App);
