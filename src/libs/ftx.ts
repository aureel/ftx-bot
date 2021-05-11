import { RestClient } from "ftx-api/lib/rest-client";
import { WebsocketClient } from "ftx-api/lib/websocket-client";

export interface FTXOrder {
  orderId: string;
  market: string;
  side: string;
  size: number;
  price?: number;
  triggerPrice?: number;
  type: string;
  orderType?: string;
}

const _logger = {
  silly: (): void => {},
  debug: (): void => {},
  notice: (): void => {},
  info: (): void => {},
  warning: (): void => {},
  error: (err): void => {
    // eslint-disable-next-line no-console
    console.error(err);
  },
};

const restClient = new RestClient(process.env.FTX_API_KEY, process.env.FTX_SECRET_KEY, {
  subAccountName: process.env.FTX_SUBACCOUNT_NAME,
});

const wsClient = new WebsocketClient(
  {
    key: process.env.FTX_API_KEY,
    secret: process.env.FTX_SECRET_KEY,
    subAccountName: process.env.FTX_SUBACCOUNT_NAME,
  },
  _logger
);

async function getOpenOrders(): Promise<FTXOrder[]> {
  const [openOrders, openTriggerOrders] = await Promise.all([
    restClient.getOpenOrders(),
    restClient.getOpenTriggerOrders(),
  ]);

  let allOpenOrders: any[] = [];
  if (openOrders.success) {
    allOpenOrders = [...openOrders.result];
  }
  if (openTriggerOrders.success) {
    allOpenOrders = [...allOpenOrders, ...openTriggerOrders.result];
  }

  return allOpenOrders.map((order) => ({
    orderId: order.id,
    market: order.market,
    side: order.side,
    size: order.size,
    price: order.price,
    triggerPrice: order.triggerPrice,
    type: order.type,
    orderType: order.orderType,
  }));
}

function initFtxWebsocketFills(orderFillsHandler: any): void {
  wsClient.subscribe("fills");
  wsClient.on("update", (data) => {
    if (data?.type !== "update") {
      return;
    }

    orderFillsHandler({
      orderId: data.data.id,
      market: data.data.market,
      price: data.data.price,
      side: data.data.side,
      size: data.data.size,
      type: data.data.type,
      orderType: data.data.orderType,
    });
  });
}

export { getOpenOrders, initFtxWebsocketFills };
