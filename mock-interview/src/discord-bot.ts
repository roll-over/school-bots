import { getEnv } from "./constants";
import Discord, { CategoryChannel, ChannelType, TextChannel } from "discord.js";

const { JUNIOR_DISCORD_BOT_TOKEN } = getEnv();
const discordClient = new Discord.Client({
  intents: [
    "Guilds",
    "GuildMessages",
    "MessageContent",
    "GuildMembers",
    "GuildInvites",
  ],
});

discordClient.login(JUNIOR_DISCORD_BOT_TOKEN);

discordClient.on("ready", () => {
  console.log(`Logged in as ${discordClient.user?.tag}!`);
});

discordClient.on("error", console.error);

export { discordClient };
