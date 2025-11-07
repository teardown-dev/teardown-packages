import {
	HTTPPlugin,
	LoggingPlugin,
	createTeardownClient,
} from "@teardown/react-native";

const loggingPlugin = new LoggingPlugin();

const teardownClient = createTeardownClient([
	["logger", loggingPlugin],
	["http", new HTTPPlugin()],
] as const);

teardownClient.logger.enable();

export default teardownClient;
