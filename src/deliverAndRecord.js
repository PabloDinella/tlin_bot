import { readLedger, writeLedger } from "./deliveryLedger.js";
import { getTodayInSaoPaulo, run } from "./run.js";

const publication = process.env.PUBLICATION || "en";
const mode = process.env.MODE || "";
const date = process.env.DELIVERY_DATE || getTodayInSaoPaulo();
const deliveryPart = process.argv[2] || "";

if (publication !== "en") {
  throw new Error(`Unsupported publication: ${publication}.`);
}

if (!["text", "audio"].includes(deliveryPart)) {
  throw new Error("Delivery part must be either text or audio.");
}

if (!["production", "staging"].includes(mode)) {
  throw new Error(`Unsupported MODE: ${mode || "(empty)"}.`);
}

const ledgerOptions = { publication, mode, date };
const existing = (await readLedger(ledgerOptions)) || {
  version: 1,
  publication,
  mode,
  date,
};

if (
  existing[deliveryPart]?.status === "sent" &&
  existing[deliveryPart]?.messageId
) {
  console.log(`${deliveryPart} was already delivered for ${date}; skipping.`);
} else {
  const result = await run({
    mode,
    token: process.env.TOKEN || "",
    channelId: process.env.CHANNEL_ID || "",
    channelIdTesting: process.env.CHANNEL_ID_TESTING || "",
    date,
    deliveryPart,
    deliveryState: existing,
  });
  const messageId =
    deliveryPart === "text" ? result.textMessageId : result.audioMessageId;

  if (!messageId) {
    throw new Error(`${deliveryPart} delivery did not return a Telegram message ID.`);
  }

  const updated = {
    ...existing,
    sourceUrl: result.sourceUrl,
    [deliveryPart]: {
      status: "sent",
      messageId,
      sentAt: new Date().toISOString(),
    },
  };

  const ledgerPath = await writeLedger(ledgerOptions, updated);
  console.log(`Recorded ${deliveryPart} delivery in ${ledgerPath}.`);
}
