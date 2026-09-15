# GitHub Actions deployment

The `Daily Telegram delivery` workflow is scheduled for 7:17 AM in
`America/Sao_Paulo`. Scheduled production delivery remains disabled unless the
repository variable `ENABLE_GITHUB_DELIVERY` is exactly `true`.

## Required environment secrets

The workflow uses the GitHub Actions environment named `tlin-bot`. Add these
under **Settings → Environments → tlin-bot**, not under a different environment:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHANNEL_ID`
- `TELEGRAM_TEST_CHANNEL_ID`

Use a newly rotated Telegram bot token. Do not reuse the token exposed in the
repository's old Git history.

## Activation

1. Create the `tlin-bot` environment and add the three environment secrets.
2. Run `Daily Telegram delivery` manually with `mode=staging` and verify the
   text and audio in the private test channel.
3. Disable the existing cron-job.org job that calls the Vercel endpoint.
4. Set the Actions repository variable `ENABLE_GITHUB_DELIVERY` to `true`.
5. Confirm that the next scheduled run creates text and audio receipts under
   `delivery-log/en/production/`.

This order prevents the Vercel cron and GitHub Actions from sending the same
daily message.

## Recovery

The workflow can be started manually with an optional `YYYY-MM-DD` date. It
checks the matching ledger file and sends only the missing part. Text and audio
are recorded in separate commits so an audio failure does not cause the text to
be sent again.

To roll back scheduling, set `ENABLE_GITHUB_DELIVERY` to `false` before
re-enabling the cron-job.org job.
