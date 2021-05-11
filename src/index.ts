import * as Sentry from "@sentry/node";

import "./init-config";
import "./init-sentry";

import { initFTXBot } from "./ftx-bot";

try {
  initFTXBot();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err);
  Sentry.captureException(err);
}
