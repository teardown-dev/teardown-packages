import type { DevServer } from "../dev-server";
// import type { DevServer } from "devtools-protocol";

export class CDPAdapter {
	constructor(private readonly instance: DevServer) {}

	enable() {}
}
