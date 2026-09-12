import { run } from "./run.js";

await run({
  mode: process.env.MODE || "",
  token: process.env.TOKEN || "",
  channelId: process.env.CHANNEL_ID || "",
  channelIdTesting: process.env.CHANNEL_ID_TESTING || "",
});
