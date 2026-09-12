import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

function validateSegment(name, value, pattern) {
  if (!pattern.test(value || "")) {
    throw new Error(`Invalid ${name}: ${value || "(empty)"}.`);
  }
}

function getLedgerPath({ root = process.cwd(), publication, mode, date }) {
  validateSegment("publication", publication, /^[a-z0-9-]+$/);
  validateSegment("mode", mode, /^(production|staging)$/);
  validateSegment("date", date, /^\d{4}-\d{2}-\d{2}$/);

  const [year, month, day] = date.split("-");
  return path.join(
    root,
    "delivery-log",
    publication,
    mode,
    year,
    month,
    `${day}.json`
  );
}

async function readLedger(options) {
  const ledgerPath = getLedgerPath(options);

  try {
    return JSON.parse(await readFile(ledgerPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function writeLedger(options, value) {
  const ledgerPath = getLedgerPath(options);
  await mkdir(path.dirname(ledgerPath), { recursive: true });

  const temporaryPath = `${ledgerPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporaryPath, ledgerPath);
  return ledgerPath;
}

export { getLedgerPath, readLedger, writeLedger };
