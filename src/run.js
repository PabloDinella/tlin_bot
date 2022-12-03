import TeleBot from "telebot";
import request from "request";
import fetch from "node-fetch";

import parse from "./parseMessage.js";

const bot = new TeleBot(process.env.TOKEN);

const channelId = process.env.CHANNEL_ID;
const channelIdTesting = process.env.CHANNEL_ID_TESTING;

const mode = process.env.MODE;

export async function run() {
  const body = await fetch("http://www.thelordisnear.ca/", {
    method: "get",
  }).then((response) => response.text());

  const parsed = parse(body);

  console.log(`Running in mode: ${mode}`);

  console.log(parsed);

  if (mode === "production") {
    bot.sendMessage(channelId, parsed.message);
    bot.sendAudio(
      channelId,
      `http://growingrace.com/mp3s/TheLordIsNear/${parsed.date.split("-")[2]}/${
        parsed.date
      }.mp3`
    );
    return true;
  }

  if (mode === "testing") {
    bot.sendMessage(channelIdTesting, parsed.message);
    bot.sendAudio(
      channelIdTesting,
      `http://growingrace.com/mp3s/TheLordIsNear/${parsed.date.split("-")[2]}/${
        parsed.date
      }.mp3`
    );
    return true;
  }

  if (mode === "logonly") {
    return true;
  }
}
