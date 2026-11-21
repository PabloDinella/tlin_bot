import { load } from "cheerio";

const AUDIO_HOST_MP3 = "mp3.thelordisnear.org";
const AUDIO_HOST_DATA = "data.thelordisnear.org";
const DATA_AUDIO_PATH = /^\/\d{4}\/hq\/[^/]+\.mp3$/;
const REQUEST_HEADERS = {
  accept: "text/html,application/xhtml+xml",
  "user-agent":
    "Mozilla/5.0 (compatible; TheLordIsNearBot/1.0; +https://t.me/thelordisnear)",
};

function parseAudioUrl(html, sourceUrl) {
  const $ = load(html);
  const value = $("audio source").attr("src");

  if (!value) {
    return null;
  }

  const url = new URL(value, sourceUrl);

  if (url.protocol !== "https:" || !url.pathname.endsWith(".mp3")) {
    throw new Error(`Unexpected audio URL: ${url.toString()}`);
  }

  if (url.hostname === AUDIO_HOST_MP3) {
    return url;
  }

  if (url.hostname === AUDIO_HOST_DATA && DATA_AUDIO_PATH.test(url.pathname)) {
    return url;
  }

  throw new Error(`Unexpected audio URL: ${url.toString()}`);
}

async function getAudioUrl(sourceUrl, fetchImpl) {
  const pageResponse = await fetchImpl(sourceUrl, {
    headers: REQUEST_HEADERS,
    signal: AbortSignal.timeout(8_000),
  });

  if (!pageResponse.ok) {
    throw new Error(`Audio page request failed with HTTP ${pageResponse.status}.`);
  }

  const audioUrl = parseAudioUrl(await pageResponse.text(), sourceUrl);

  if (!audioUrl) {
    return null;
  }

  const audioResponse = await fetchImpl(audioUrl, {
    method: "HEAD",
    headers: { "user-agent": REQUEST_HEADERS["user-agent"] },
    signal: AbortSignal.timeout(8_000),
  });

  if (!audioResponse.ok) {
    throw new Error(`Audio file request failed with HTTP ${audioResponse.status}.`);
  }

  const contentType = audioResponse.headers?.get?.("content-type") || "";

  if (!contentType.toLowerCase().startsWith("audio/")) {
    throw new Error(`Unexpected audio content type: ${contentType || "missing"}.`);
  }

  return audioUrl.toString();
}

export { getAudioUrl, parseAudioUrl };
