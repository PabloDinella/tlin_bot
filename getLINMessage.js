const request = require("request");
const { load } = require('cheerio');

// request({
//   uri: "http://www.thelordisnear.ca/",
// }, function (error, response, body) {
//   console.log(parse(body));
// });

function parse(body) {
  const $ = load(body);
  const date = $('#GridView1_Label6_0').text().trim();
  const message = `${date}

${$('#GridView1_Label1_0').find('p').not(':first-child').map(function (i, el) {
    return $(this).text();
  }).get().join('\n\n')}
`

  return {
    message,
    date: date.replace(/(\d+)\/(\d+)\/(\d+)/, "$2-$1-$3")
  };
}

module.exports = parse;
