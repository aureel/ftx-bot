import * as Sentry from "@sentry/node";

import { initTelegramBot, sendMessage, TelegramMessage } from "./libs/telegram";
import { getOpenOrders, initFtxWebsocketFills, FTXOrder } from "./libs/ftx";

function initFTXBot(): void {
  initTelegramBot(_telegramMessageHandler);
  initFtxWebsocketFills(_ftxFillsHandler);
}

async function _telegramMessageHandler(message: TelegramMessage): Promise<any> {
  try {
    if (/getorders/i.test(message.text)) {
      const openOrders = await getOpenOrders();
      const formattedOrders = _formatFTXOrders(openOrders);
      return sendMessage({
        chatId: process.env.TELEGRAM_CHAT_ID!,
        message: `You have <b>${
          openOrders.length
        }</b> order(s) currently opened\n${formattedOrders.join("\n")}`,
      });
    }

    return sendMessage({
      chatId: process.env.TELEGRAM_CHAT_ID!,
      message: "Command not supported yet :(",
    });
  } catch (err) {
    return _handleError(err);
  }
}

async function _ftxFillsHandler(order: FTXOrder): Promise<void> {
  try {
    const formattedOrders = _formatFTXOrders([order]);
    await sendMessage({
      chatId: process.env.TELEGRAM_CHAT_ID!,
      message: `The following order just filled:\n${formattedOrders.join("\n")}`,
    });
  } catch (err) {
    _handleError(err);
  }
}

function _formatFTXOrders(orders: FTXOrder[]): string[] {
  return orders.map((order) => {
    const orderType = order.orderType != null ? `${order.type} ${order.orderType}` : order.type;
    const price = order.triggerPrice != null ? order.triggerPrice : order.price;
    const { baseCurrency, quoteCurrency } = _getBaseAndQuoteCurrencies(order.market);

    return `[${order.market}] - ${orderType} ${order.side} ${order.size} ${baseCurrency} @ ${price} ${quoteCurrency}`;
  });
}

function _getBaseAndQuoteCurrencies(
  market: string
): { baseCurrency: string; quoteCurrency: string } {
  // for ie BTC/USD
  if (market.includes("/")) {
    const [baseCurrency, quoteCurrency] = market.split("/");
    return { baseCurrency, quoteCurrency };
  }

  // for ie TSLA-0924 or BTC-PERP
  if (market.includes("-")) {
    const [baseCurrency] = market.split("-");
    return { baseCurrency, quoteCurrency: "USD" };
  }

  // for ie TRUMP2024
  return { baseCurrency: market, quoteCurrency: "USD" };
}

function _handleError(err) {
  // eslint-disable-next-line no-console
  console.error(err);
  Sentry.captureException(err);
}

export { initFTXBot };
