import Slimbot from "slimbot";

const slimbot = new Slimbot(process.env.TELEGRAM_TOKEN);

export interface TelegramMessage {
  text: string;
}

async function sendMessage(params: { chatId: string; message: string }): Promise<any> {
  const { chatId, message } = params;

  return slimbot.sendMessage(chatId, message, {
    parse_mode: "HTML",
  });
}

function initTelegramBot(messageHandler: Function): void {
  // Register listeners
  slimbot.on("message", messageHandler);
  slimbot.on("edited_message", messageHandler);
  slimbot.startPolling();
}

export { initTelegramBot, sendMessage };
