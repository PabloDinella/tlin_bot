import { run } from "../src/run";

export default async function handler(request, response) {
  const result = await run();

  if (result) {
    return response.status(200).json({
      message: "Message sent to telegram channel.",
    });
  }

  return response.status(500).json({
    message: "Couldn't send message to telegram channel.",
  });
}
