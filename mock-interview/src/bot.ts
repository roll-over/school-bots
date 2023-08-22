import TelegramBot from "node-telegram-bot-api";
import { getEnv } from "./constants";

const bot = new TelegramBot(getEnv().MOCK_INTERVIEW_TELEGRAM_BOT, { polling: true });

export { bot };
