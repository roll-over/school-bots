export const getEnv = () => {
  function addEnv(variableName: string) {
    const value = process.env[variableName];
    if (!value) {
      console.log(`${variableName} is not set`);
      process.exit(1);
    }
    return value;
  }
  return {
    MOCK_INTERVIEW_TELEGRAM_BOT: addEnv("MOCK_INTERVIEW_TELEGRAM_BOT"),
    ME_CONFIG_MONGODB_URL: addEnv("ME_CONFIG_MONGODB_URL"),
    JUNIOR_DISCORD_BOT_TOKEN: addEnv("JUNIOR_DISCORD_BOT_TOKEN"),
    GUILD_ID: addEnv("GUILD_ID"),
    MOCK_INTERVIEW_CHANNEL_ID: addEnv("MOCK_INTERVIEW_CHANNEL_ID"),
    AFISHA_SHCOOL_GUILD_ID: addEnv("AFISHA_SHCOOL_GUILD_ID"),
    AFISHA_AHCOOL_MOCK_INTERVIEW_CHANNEL_ID: addEnv("AFISHA_AHCOOL_MOCK_INTERVIEW_CHANNEL_ID"),
  };
};
