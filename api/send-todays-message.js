import { run } from "../src/run.js";

export default async (request, response) => {
  if (!["GET", "POST"].includes(request.method)) {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ message: "Method not allowed." });
  }

  try {
    await run({
      mode: process.env.MODE || "",
      token: process.env.TOKEN || "",
      channelId: process.env.CHANNEL_ID || "",
      channelIdTesting: process.env.CHANNEL_ID_TESTING || "",
    });

    return response.status(200).json({
      message: "Message sent to telegram channel.",
    });
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Couldn't send message to telegram channel.",
    });
  }
};
