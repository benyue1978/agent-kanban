import { buildApp } from "./app.js";
import { getConfig } from "./config.js";

const app = await buildApp();
const config = getConfig();

await app.listen({ port: config.port, host: "0.0.0.0" });
