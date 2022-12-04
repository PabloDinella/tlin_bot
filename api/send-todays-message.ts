import type { VercelRequest, VercelResponse } from "@vercel/node";
import { run } from "../src/run";

export default async (request: VercelRequest, response: VercelResponse) => {
  const result = await run({
    mode: process.env.MODE || '',
    token: process.env.TOKEN || '',
    channelId: process.env.CHANNEL_ID || '',
    channelIdTesting: process.env.CHANNEL_ID_TESTING || '',
  });

  if (result) {
    return response.status(200).json({
      message: "Message sent to telegram channel.",
    });
  }

  return response.status(500).json({
    message: "Couldn't send message to telegram channel.",
  });
};
