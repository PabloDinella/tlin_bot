const TeleBot = require('telebot');
const fs = require('fs');
const path = require('path');

const bot = new TeleBot(process.env.TOKEN);

const http = require('http');
const request = require('request');
const {load} = require('cheerio');

const channelID = process.env.channelID;

request({
  uri: "http://www.thelordisnear.ca/",
}, function(error, response, body) {

  const parsed = parse(body)


  var file = fs.createWriteStream(path.join(__dirname, 'mp3', parsed.date+'.mp3'));
  request.get(`http://growingrace.com/mp3s/TheLordIsNear/${parsed.date.split('-')[2]}/${parsed.date}.mp3`).pipe(file);

  file.on('finish', () => {
    bot.sendMessage(channelID, parsed.message)
    bot.sendAudio(channelID, path.join(__dirname, 'mp3', parsed.date+'.mp3'))
  })


});

function parse(body) {
  const $ = load(body);
  const date = $('#GridView1_Label6_0').text().trim();
  const texts = $('.LIN2014_LINtext').map((i,el) => {
    return $(el).text();
  }).get();

  const message = `${date}

${$('.LIN2014_Scripture').text()}

${$('.LIN2014_Title').text().toUpperCase()}

${$('.LIN2014_First').text()}

${texts.join('\n\n')}

${$('.LIN2014_Author').text()}`

  fs.writeFile(path.join(__dirname, 'output', date.replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$2-$1.txt")), message, () => {})

  return {
    message,
    date: date.replace(/(\d+)\/(\d+)\/(\d+)/, "$2-$1-$3")
  };

}
