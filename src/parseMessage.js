import { load } from "cheerio";
import { stripHtml } from "string-strip-html";

function parse(body) {
  const $ = load(body);

  const date = $("time").attr("datetime");

  const formattedDate = $(".LIN-Date").text();

  const audioUrl = $("audio source").attr("src");

  const message = `${formattedDate}

${$(".LIN-HeadVerse").text().trim()}

${$(".LIN-Title").text().trim()}

${stripHtml($(".LIN-Text").toString(), {
  cb: ({ tag, deleteFrom, deleteTo, insert, rangesArr, proposedReturn }) => {
    if (tag.name === "p" && tag.slashPresent) {
      rangesArr.push([deleteFrom, deleteTo, "\n\n"]);
    }
    rangesArr.push([deleteFrom, deleteTo, insert]);
  },
}).result.trim()}

${$(".LIN-Author").text()}

View, share or find the printed version of this message on the website: ${$(
    "#page-url"
  ).attr("href")}
`;

  return {
    message,
    date,
    formattedDate,
    audioUrl,
  };
}

export default parse;
