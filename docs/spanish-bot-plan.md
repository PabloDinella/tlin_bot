# Spanish bot implementation plan

## Confirmed sources

- Daily page: `https://labuenasemilla.net/esec/YYYYMMDD`
- Podcast feed: `https://feeds.captivate.fm/el-senor-esta-cerca/`
- The Captivate item for a date contains the full Spanish meditation and an
  `audio/mpeg` enclosure published by Granos de Vida.
- GBV API product `1029` is Spanish, but it belongs to *La Buena Semilla*, not
  *El Señor Está Cerca*. It must not be used for this bot.

## Implementation

1. Extract publication-specific behavior from the English implementation:
   source adapter, locale/date formatting, source URL, Telegram credentials,
   and ledger namespace.
2. Add a Spanish Captivate adapter that reads the item matching the requested
   São Paulo date, validates its publication date, builds the Telegram text
   from the feed content, and accepts audio only from Captivate's HTTPS media
   hosts with an `audio/mpeg` content type.
3. Cross-check the feed item against the matching `labuenasemilla.net/esec`
   daily page so a stale or incorrectly dated feed cannot be published.
4. Add fixtures and tests for accents, Spanish date formatting, author
   extraction, Telegram's 4096-character limit, missing or late feed items,
   and MP3 validation.
5. Reuse the GitHub Actions ledger under `delivery-log/es/...`, with separate
   text and audio receipts and the same concurrency protection as English.
6. Add separate GitHub secrets for the Spanish bot token and production/test
   channel IDs. Keep Spanish scheduling disabled until a private-channel test
   confirms both messages.
7. Enable Spanish at 7:05 AM in `America/Sao_Paulo`, offset from English to
   simplify logs and reduce simultaneous external requests.

## Inputs still required

- Spanish Telegram bot token
- Spanish production channel ID or username
- Spanish private testing channel ID or username
- Confirmation that the public message should link to the La Buena Semilla
  daily page
