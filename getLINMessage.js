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

${$('#GridView1_Label1_0').find('p').not(':first-child').map(function(i, el) {
  // this === el
  return $(this).text();
}).get().join('\n\n')}
`

  return message;

}
