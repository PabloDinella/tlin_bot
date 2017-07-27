const request = require("request");
const {load} = require('cheerio');

request({
  uri: "http://www.thelordisnear.ca/",
}, function(error, response, body) {
  console.log(parse(body));
});

function parse(body) {
  const $ = load(body);
  const texts = $('.LIN2014_LINtext').map((i,el) => {
    return $(el).text();
  }).get();

  const message = `${$('#GridView1_Label6_0').text().trim()}

${$('.LIN2014_Scripture').text()}

**${$('.LIN2014_Title').text()}**

${$('.LIN2014_First').text()}

${texts.join('\n\n')}

__${$('.LIN2014_Author').text()}__`

  return message;

}
