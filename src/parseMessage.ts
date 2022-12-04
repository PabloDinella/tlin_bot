import { load } from "cheerio";
import { stripHtml } from "string-strip-html";

function parse(body: string) {
  const $ = load(body);

  const date = $("#GridView1_Label6_0")
    .text()
    .trim()
    .replace(/(\d+)\/(\d+)\/(\d+)/, "$2-$1-$3");

  console.log($(".LIN-Text").toString());

  const message = `${$(".LIN-Date").text()}

${$(".LIN-HeadVerse").text()}

${$(".LIN-Title").text()}

${stripHtml($(".LIN-Text").toString(), {
  cb: ({ tag, deleteFrom, deleteTo, insert, rangesArr, proposedReturn }) => {
    if (tag.name === "p" && tag.slashPresent) {
      rangesArr.push([deleteFrom, deleteTo, "\n\n"]);
    }
    rangesArr.push([deleteFrom, deleteTo, insert]);
  },
}).result.trim()}

${$(".LIN-Author").text()}
`;

  return {
    message,
    date,
  };
}

export default parse;
