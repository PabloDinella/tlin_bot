import TeleBot from "telebot";

import request from "request";
import parse from "./parseMessage.js";

const bot = new TeleBot(process.env.TOKEN);

const channelID = process.env.channelID;

request(
  {
    uri: "http://www.thelordisnear.ca/",
  },
  function (error, response, body) {
    const parsed = parse(body);

    console.log(`DRY_RUN: ${process.env.DRY_RUN}`);

    console.log(parsed);

    if (process.env.DRY_RUN !== "true") {
      bot.sendMessage(channelID, parsed.message);
      bot.sendAudio(
        channelID,
        `http://growingrace.com/mp3s/TheLordIsNear/${
          parsed.date.split("-")[2]
        }/${parsed.date}.mp3`
      );
    }
  }
);
