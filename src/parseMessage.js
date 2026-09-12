import { load } from "cheerio";

const REQUIRED_FIELDS = ["date", "scripture", "ref", "title", "text"];

function htmlToText(html) {
  const $ = load(html || "", null, false);
  const paragraphs = $("p")
    .toArray()
    .map((paragraph) => $(paragraph).text().trim())
    .filter(Boolean);

  return paragraphs.length > 0
    ? paragraphs.join("\n\n")
    : $.root().text().trim();
}

function formatDate(date) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(Date.UTC(year, month - 1, day)));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.weekday} ${values.month} ${values.day}, ${values.year}`;
}

function parse(record) {
  if (!record || typeof record !== "object") {
    throw new Error("GBV API returned an invalid response.");
  }

  const missingFields = REQUIRED_FIELDS.filter(
    (field) => typeof record[field] !== "string" || record[field].trim() === ""
  );

  if (missingFields.length > 0) {
    throw new Error(`GBV API response is missing: ${missingFields.join(", ")}.`);
  }

  const date = record.date.slice(0, 10);
  const content = load(record.text, null, false);
  const authorParagraph = content("p")
    .toArray()
    .findLast((paragraph) =>
      /text-align\s*:\s*right/i.test(content(paragraph).attr("style") || "")
    );
  const author = authorParagraph ? content(authorParagraph).text().trim() : "";

  if (authorParagraph) {
    content(authorParagraph).remove();
  }

  const scripture = `${htmlToText(record.scripture)} ${record.ref.trim()}`;
  const body = htmlToText(content.html());
  const formattedDate = formatDate(date);
  const sourceUrl = `https://thelordisnear.org/${date.slice(0, 4)}/${date.slice(
    5,
    7
  )}${date.slice(8, 10)}`;
  const message = `${formattedDate}

${scripture}

${record.title.trim()}

${body}

${author}

View, share or find the printed version of this message on the website: ${sourceUrl}
`;

  if (message.length > 4096) {
    throw new Error(`Telegram message is too long (${message.length} characters).`);
  }

  return {
    message,
    date,
    formattedDate,
    sourceUrl,
  };
}

export default parse;
