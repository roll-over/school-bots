import TelegramBot, { Chat } from "node-telegram-bot-api";
import { bot } from "./bot";
import { v4 } from "uuid";
import {
  Registration,
  updateActiveRegistration,
  getActiveRegistration,
  updateChatState,
  getChatState,
  removeRegistration,
  getDiscordThreadId,
  setDiscordThreadId,
  getAllDiscordThreadsIds,
  getRegistrationByInterviewId,
  getTelegramChatIdByDiscordThreadId,
  getAllChats,
  ChatState,
  setUses,
  setInvite,
  getUses,
  getInviteWithUserIdPairs,
  setDiscordUserId,
} from "./mongo-client";
import { Languagies, commands, localisation } from "./localisation";
import { Invite, TextChannel, ThreadAutoArchiveDuration } from "discord.js";
import { discordClient } from "./discord-bot";
import { getEnv } from "./constants";

const {
  GUILD_ID,
  MOCK_INTERVIEW_CHANNEL_ID,
  AFISHA_SHCOOL_GUILD_ID,
  AFISHA_AHCOOL_MOCK_INTERVIEW_CHANNEL_ID,
} = getEnv();

const convertRegistrationToText = (registration: Registration) => {
  return `${registration.role}, ${registration.language}, ${registration.typeOfInterview}`;
};

type RegistrationShort = {
  role: Registration["role"];
  language: Registration["language"];
  typeOfInterview: Registration["typeOfInterview"];
};

const deconvertTextToRegistration = (
  text: string
): RegistrationShort | null => {
  if (!text) {
    return null;
  }
  const [role, language, typeOfInterview] = text.split(", ");

  if (!role || !language || !typeOfInterview) {
    return null;
  }

  return {
    role,
    language,
    typeOfInterview,
  } as RegistrationShort;
};

const updateInvites = async () => {
  const uses = await (
    await discordClient.guilds.fetch(AFISHA_SHCOOL_GUILD_ID)
  )?.invites
    .fetch()
    .then((invites) => {
      return [...invites.entries()].map(([id, invite]: [string, Invite]) => ({
        id,
        uses: invite.uses,
      }));
    });

  await setUses(uses || []);
};

const sendToChannel = async (channelID: string, message: string) => {
  const channel = await discordClient.channels.fetch(channelID, {
    allowUnknownGuild: true,
  });

  if (message.length < 2000) {
    await (channel as TextChannel).send(message);

    return;
  }

  const chunks: string[] = [];

  message.split("\n").forEach(async (x) => {
    if (chunks.length === 0) {
      chunks.push(x);
    } else if (chunks[chunks.length - 1]?.length + x.length < 2000) {
      chunks[chunks.length - 1] = chunks[chunks.length - 1] + "\n" + x;
    } else {
      const subChunks = String(x).match(/.{1,2000}/gs);
      subChunks?.forEach((y) => {
        chunks.push(y);
      });
    }
  });

  if (!chunks) {
    console.log("No chunks");
    return;
  }
  for (const chunk of chunks) {
    await (channel as TextChannel).send(chunk);
  }
};

discordClient.on("messageCreate", async (msg) => {
  if (msg.author.bot) {
    return;
  }

  if ((await getAllDiscordThreadsIds()).includes(msg.channel.id)) {
    const chatId = await getTelegramChatIdByDiscordThreadId(msg.channel.id);
    if (!chatId) {
      msg.reply("Bot: Не могу найти чат");
      return;
    }

    await bot.sendMessage(chatId, "Менеджер: " + msg.content).catch((e) => {
      msg.reply("Bot: Не могу отправить сообщение в телеграм");
      console.error(e);
    });

    return;
  }

  if (msg.channel.id === "1141761181489565796") {
    if (msg.content.startsWith("/get_pairs")) {
      const allChats = await getAllChats();
      const allRegistrationsWithUsersId = allChats
        .map((x) => {
          return x.registrations.map((y) => {
            return {
              ...y,
              ...x,
            };
          });
        })
        .flat();

      type RegistrationWithUser = Registration & ChatState;

      const pairsStruct = {
        interviewer: {
          ru: {
            hr: [] as RegistrationWithUser[],
            algo: [] as RegistrationWithUser[],
            behavioral: [] as RegistrationWithUser[],
          },
          en: {
            hr: [] as RegistrationWithUser[],
            algo: [] as RegistrationWithUser[],
            behavioral: [] as RegistrationWithUser[],
          },
        },
        interviewee: {
          ru: {
            hr: [] as RegistrationWithUser[],
            algo: [] as RegistrationWithUser[],
            behavioral: [] as RegistrationWithUser[],
          },
          en: {
            hr: [] as RegistrationWithUser[],
            algo: [] as RegistrationWithUser[],
            behavioral: [] as RegistrationWithUser[],
          },
        },
      };
      allRegistrationsWithUsersId.forEach((x) => {
        if (x.language === "noImportant") {
          pairsStruct[x.role].ru[x.typeOfInterview].push(x);
          pairsStruct[x.role].en[x.typeOfInterview].push(x);
          return;
        }
        pairsStruct[x.role][x.language][x.typeOfInterview].push(x);
      });
      let answerLine = "";

      (["ru", "en"] as ("en" | "ru")[]).forEach((language) => {
        (
          ["hr", "algo", "behavioral"] as ("hr" | "algo" | "behavioral")[]
        ).forEach((typeOfInterview) => {
          const interviewersLine = pairsStruct.interviewer[language][
            typeOfInterview
          ]
            .map(
              (x) =>
                `https://discordapp.com/channels/${
                  x.discordGuildId || AFISHA_SHCOOL_GUILD_ID
                }/${x.discordChatId}`
            )
            .join("\n");

          const intervieweesLine = pairsStruct.interviewee[language][
            typeOfInterview
          ]
            .map(
              (x) =>
                `https://discordapp.com/channels/${
                  x.discordGuildId || AFISHA_SHCOOL_GUILD_ID
                }/${x.discordChatId}`
            )
            .join("\n");

          if (!interviewersLine && !intervieweesLine) {
            return;
          }
          answerLine += `${language} ${typeOfInterview}:\n`;

          answerLine += `Interviewers:\n${
            interviewersLine || "-"
          }\nInterviewees:\n${intervieweesLine || "-"}\n\n`;
        });
      });

      await msg.reply(answerLine);

      console.log(pairsStruct);
    }

    if (msg.content.startsWith("/send_invite")) {
      const argument = msg.content.split(" ")[1];
      if (!argument) {
        msg.reply("Не указан аргумент c сылкой на чат с участником");
        return;
      }

      const discordThreadId = argument.split("/").pop() || "";
      if (!discordThreadId) {
        msg.reply("Не могу найти discordThreadId");
        return;
      }

      const chatId = await getTelegramChatIdByDiscordThreadId(discordThreadId);

      if (!chatId) {
        msg.reply("Не могу найти телеграм чат участника");
        return;
      }

      let invite = await (msg.channel as TextChannel)
        .createInvite({
          maxAge: 2592000,
          maxUses: 1,
        })
        .catch((e) => console.error(e));
      msg.reply(invite?.url || "Не могу создать инвайт");
      const inviteId = invite?.code || "";

      await setInvite(chatId, inviteId);
      await updateInvites();

      bot
        .sendMessage(
          chatId,
          "Менеджер: Пожалуйста, зайдите на сервер, чтобы мы могли связать вас с интервьюером " +
            invite?.url +
            " ссылка действительна 30 дней"
        )
        .catch((e) => {
          msg.reply("Bot: Не могу отправить сообщение в телеграм");
          console.error(e);
        });
    }
  }
});

discordClient.on("guildMemberAdd", async (member) => {
  if (member.guild.id !== AFISHA_SHCOOL_GUILD_ID) {
    return;
  }
  console.log("guildMemberAdd", member.user.id);

  const oldUses = await getUses();

  await updateInvites();

  const newUses = await getUses();
  const newUsesIds = newUses.map((x) => x.id);

  console.log(oldUses, newUses);
  const lostInvite = oldUses.find((x) => !newUsesIds.includes(x.id));
  console.log(lostInvite);

  const usersWithLostInvite = await getInviteWithUserIdPairs();

  const user = usersWithLostInvite.find((x) => x.inveteId === lostInvite?.id);
  if (!user) {
    console.log("user not found");
    return;
  }

  await setDiscordUserId(user.chatId, member.user.id);
});

discordClient.on("inviteCreate", async (invite) => {
  console.log("inviteCreate");
});

discordClient.on("inviteDelete", async (invite) => {
  console.log("inviteDelete");
});

bot.on("message", async (msg) => {
  msg.text = msg.text || "";
  if (!msg.text) {
    return;
  }

  let threadId = await getDiscordThreadId(msg.chat.id);
  if (!threadId) {
    const guildId = AFISHA_SHCOOL_GUILD_ID;
    const landChatId = AFISHA_AHCOOL_MOCK_INTERVIEW_CHANNEL_ID;
    discordClient.guilds.fetch(guildId).then((guild) => {
      guild.channels.fetch(landChatId).then(async (channel) => {
        const threadName = `${msg.from?.first_name} ${msg.from?.last_name} ${msg.from?.username} ${msg.from?.id}`;
        await sendToChannel(landChatId, threadName);

        const messages = await (channel as TextChannel)?.messages.fetch({
          limit: 1,
        });

        const thread = await messages.first()?.startThread({
          name: threadName,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        });
        const threadId = thread?.id || "";
        if (!threadId) {
          await bot.sendMessage(msg.chat.id, "Не могу создать тред");
          return;
        }

        const treadChannel = await discordClient.channels.fetch(threadId || "");
        const treadChannelText = treadChannel as TextChannel;
        await treadChannelText?.send(
          "<@&1124934903713234984>, <@&1124931740352385089>"
        );
        await treadChannelText?.send("User to chat: " + msg.text || "");

        await setDiscordThreadId(msg.chat.id, threadId);
      });
    });
  } else {
    const treadChannel = await discordClient.channels.fetch(threadId || "");
    const treadChannelText = treadChannel as TextChannel;
    await treadChannelText?.send("User to chat: " + msg.text || "");
  }
  threadId = await getDiscordThreadId(msg.chat.id);

  const chatLang = "ru";
  const activeInterviewId =
    (await getChatState(msg.chat.id))?.activeRegistration || v4();

  const start = async (msg: TelegramBot.Message) => {
    await bot.sendMessage(msg.chat.id, localisation[chatLang].welcome, {
      reply_markup: {
        keyboard: [
          [
            {
              text: localisation[chatLang].newRequest,
            },
          ],
          [
            {
              text: localisation[chatLang].getRegistrations,
            },
          ],
        ],
      },
    });
  };

  if (msg.text === "/start") {
    await start(msg);
    return;
  }

  const updateRegistration = async (
    chatId: number,
    interviewId: Registration["interviewId"]
  ) => {
    await bot.sendMessage(chatId, localisation[chatLang].roleOnInterview, {
      reply_markup: {
        keyboard: [
          [
            {
              text: localisation[chatLang].roles.interviewer,
            },
          ],
          [
            {
              text: localisation[chatLang].roles.interviewee,
            },
          ],
          [
            {
              text: localisation[chatLang].rejectRegistration,
            },
          ],
        ],
      },
    });
    await updateActiveRegistration(chatId, interviewId);
  };

  if (commands.newRequest.includes(msg.text)) {
    await updateRegistration(msg.chat.id, activeInterviewId);
    return;
  }
  if (commands.getRegistrations.includes(msg.text)) {
    const chatState = await getChatState(msg.chat.id);

    const registrations = chatState?.registrations;

    const keyboard = registrations?.length
      ? {
          reply_markup: {
            keyboard: [
              [
                {
                  text: localisation[chatLang].toTheMainPage,
                },
              ],
              ...registrations.map((x) => [
                {
                  text: convertRegistrationToText(x),
                },
              ]),
            ],
          },
        }
      : undefined;

    if (!registrations || !registrations.length) {
      await bot.sendMessage(
        msg.chat.id,
        localisation[chatLang].youDontHaveRegistrations
      );
      return;
    } else {
      bot.sendMessage(
        msg.chat.id,
        localisation[chatLang].pickRegistration,
        keyboard
      );
      return;
    }
  }

  if (commands.toTheMainPage.includes(msg.text)) {
    await start(msg);
    return;
  }

  const pickLanguage = async (chatId: number) => {
    await bot.sendMessage(
      chatId,
      localisation[chatLang].pickLanguageOfInterview,
      {
        reply_markup: {
          keyboard: [
            [
              {
                text: localisation[chatLang].interviewLanguages.ru,
              },
            ],
            [
              {
                text: localisation[chatLang].interviewLanguages.en,
              },
            ],
            [
              {
                text: localisation[chatLang].interviewLanguages.noImportant,
              },
            ],
            [
              {
                text: localisation[chatLang].rejectRegistration,
              },
            ],
          ],
        },
      }
    );
  };

  const pickTypeOfInterview = async (chatId: number) => {
    await bot.sendMessage(chatId, localisation[chatLang].typeOfInterview, {
      reply_markup: {
        keyboard: [
          [
            {
              text: localisation[chatLang].typesOfInterview.hr,
            },
          ],
          // [
          //   {
          //     text: localisation[chatLang].typesOfInterview.algo,
          //   },
          // ],
          // [
          //   {
          //     text: localisation[chatLang].typesOfInterview.behavioral,
          //   },
          // ],
          [
            {
              text: localisation[chatLang].rejectRegistration,
            },
          ],
        ],
      },
    });
  };

  const getRegistrationText = async (
    registration: RegistrationShort | null | undefined
  ) => {
    return `
    ${localisation[chatLang].endRegistrationForm.registrationEnded}
    
    ${localisation[chatLang].endRegistrationForm.role}: ${
      registration?.role
        ? localisation[chatLang].roles[registration.role]
        : localisation[chatLang].noPicked
    }
    ${localisation[chatLang].endRegistrationForm.language}: ${
      registration?.language
        ? localisation[chatLang].endRegistrationForm.languages[
            registration.language as Languagies
          ]
        : localisation[chatLang].noPicked
    }
    ${localisation[chatLang].endRegistrationForm.type}: ${
      registration?.typeOfInterview
        ? localisation[chatLang].typesOfInterview[registration.typeOfInterview]
        : localisation[chatLang].noPicked
    }
    `;
  };

  const applyRegistration = async (chatId: number) => {
    await bot.sendMessage(chatId, localisation[chatLang].registrationApplied);
    const registration = await getActiveRegistration(chatId);
    await sendToChannel(
      threadId || "",
      "System: " + (await getRegistrationText(registration))
    );
    await updateActiveRegistration(chatId, null);
    await start(msg);
  };

  const rejectRegistration = async (chatId: number) => {
    const activeInterviewId =
      (await getChatState(chatId))?.activeRegistration || "";
    await removeRegistration(chatId, activeInterviewId);
    await updateActiveRegistration(chatId, null);
    await bot.sendMessage(chatId, localisation[chatLang].registrationRejected);
    await start(msg);
  };

  const endRegistration = async (chatId: number) => {
    const registration = await getActiveRegistration(chatId);
    await bot.sendMessage(
      chatId,
      `
${localisation[chatLang].endRegistrationForm.role}: ${
        registration?.role
          ? localisation[chatLang].roles[registration.role]
          : localisation[chatLang].noPicked
      }
${localisation[chatLang].endRegistrationForm.language}: ${
        registration?.language
          ? localisation[chatLang].endRegistrationForm.languages[
              registration.language as Languagies
            ]
          : localisation[chatLang].noPicked
      }
${localisation[chatLang].endRegistrationForm.type}: ${
        registration?.typeOfInterview
          ? localisation[chatLang].typesOfInterview[
              registration.typeOfInterview
            ]
          : localisation[chatLang].noPicked
      }
`,
      {
        reply_markup: {
          keyboard: [
            [
              {
                text: localisation[chatLang].applyRegistration,
              },
            ],
            [
              {
                text: localisation[chatLang].rejectRegistration,
              },
            ],
          ],
        },
      }
    );
  };

  if (commands.interviewer.includes(msg.text)) {
    await bot.sendMessage(
      msg.chat.id,
      localisation[chatLang].youAreInterviewer
    );
    await pickLanguage(msg.chat.id);
    await updateChatState(msg.chat.id, {
      interviewId: activeInterviewId,
      role: "interviewer",
    });
    return;
  } else if (commands.interviewee.includes(msg.text)) {
    await bot.sendMessage(
      msg.chat.id,
      localisation[chatLang].youAreInterviewee
    );
    await pickLanguage(msg.chat.id);
    await updateChatState(msg.chat.id, {
      interviewId: activeInterviewId,
      role: "interviewee",
    });
    return;
  }

  if (commands.interviewInRu.includes(msg.text)) {
    await bot.sendMessage(
      msg.chat.id,
      localisation[chatLang].interviewLanguages.ru
    );
    await updateChatState(msg.chat.id, {
      interviewId: activeInterviewId,
      language: "ru",
    });
    await pickTypeOfInterview(msg.chat.id);
    return;
  } else if (commands.interviewInEn.includes(msg.text)) {
    await bot.sendMessage(
      msg.chat.id,
      localisation[chatLang].interviewLanguages.en
    );
    await updateChatState(msg.chat.id, {
      interviewId: activeInterviewId,
      language: "en",
    });
    await pickTypeOfInterview(msg.chat.id);
    return;
  } else if (commands.interviewInNoImportant.includes(msg.text)) {
    await bot.sendMessage(
      msg.chat.id,
      localisation[chatLang].interviewLanguages.noImportant
    );
    await updateChatState(msg.chat.id, {
      interviewId: activeInterviewId,
      language: "noImportant",
    });
    await pickTypeOfInterview(msg.chat.id);
    return;
  }

  if (commands.hrInterview.includes(msg.text)) {
    await bot.sendMessage(msg.chat.id, "HR Interview");
    await updateChatState(msg.chat.id, {
      interviewId: activeInterviewId,
      typeOfInterview: "hr",
    });
    await endRegistration(msg.chat.id);
    return;
  } else if (commands.algoInterview.includes(msg.text)) {
    await bot.sendMessage(msg.chat.id, "algo Interview");
    await updateChatState(msg.chat.id, {
      interviewId: activeInterviewId,
      typeOfInterview: "algo",
    });
    await endRegistration(msg.chat.id);
    return;
  } else if (commands.behavioralInterview.includes(msg.text)) {
    await bot.sendMessage(msg.chat.id, "Behavioral Interview");
    await updateChatState(msg.chat.id, {
      interviewId: activeInterviewId,
      typeOfInterview: "behavioral",
    });
    await endRegistration(msg.chat.id);
    return;
  }
  if (msg.text === "/cancel_registration") {
    await rejectRegistration(msg.chat.id);
    return;
  }

  if (commands.applyRegistration.includes(msg.text)) {
    await applyRegistration(msg.chat.id);
    return;
  } else if (commands.rejectRegistration.includes(msg.text)) {
    await rejectRegistration(msg.chat.id);
    return;
  }

  const registration = deconvertTextToRegistration(msg.text);
  if (registration) {
    await bot.sendMessage(
      msg.chat.id,
      `
      ${localisation[chatLang].endRegistrationForm.registrationEnded}
      
      ${localisation[chatLang].endRegistrationForm.role}: ${
        registration?.role
          ? localisation[chatLang].roles[registration.role]
          : localisation[chatLang].noPicked
      }
      ${localisation[chatLang].endRegistrationForm.language}: ${
        registration?.language
          ? localisation[chatLang].endRegistrationForm.languages[
              registration.language as Languagies
            ]
          : localisation[chatLang].noPicked
      }
      ${localisation[chatLang].endRegistrationForm.type}: ${
        registration?.typeOfInterview
          ? localisation[chatLang].typesOfInterview[
              registration.typeOfInterview
            ]
          : localisation[chatLang].noPicked
      }
      `,
      {
        reply_markup: {
          keyboard: [
            [
              {
                text: localisation[chatLang].edit + " - " + msg.text,
              },
              {
                text: localisation[chatLang].remove + " - " + msg.text,
              },
            ],
            [
              {
                text: localisation[chatLang].toTheMainPage,
              },
            ],
          ],
        },
      }
    );
  }

  const findRegistration = async (
    chatId: number,
    registration: {
      role: Registration["role"];
      language: Registration["language"];
      typeOfInterview: Registration["typeOfInterview"];
    }
  ) => {
    const _registration = (await getChatState(chatId))?.registrations.find(
      (x) => {
        return (
          x.role === registration.role &&
          x.language === registration.language &&
          x.typeOfInterview === registration.typeOfInterview
        );
      }
    );
    return _registration;
  };

  const getInterviewId = async (chatId: number, _msg: string | undefined) => {
    const shortRegistration = deconvertTextToRegistration(_msg || "");
    if (!shortRegistration) {
      return;
    }
    const interviewId = (await findRegistration(chatId, shortRegistration))
      ?.interviewId;

    if (!interviewId) {
      return;
    }
    return interviewId;
  };

  if (commands.edit.includes(msg.text.split(" - ")[0])) {
    const interviewId = await getInterviewId(
      msg.chat.id,
      msg.text?.split(" - ")?.[1]
    );

    await updateRegistration(msg.chat.id, interviewId || "");
    return;
  } else if (commands.remove.includes(msg.text.split(" - ")[0])) {
    const interviewId =
      (await getInterviewId(
        msg.chat.id,

        msg.text?.split(" - ")?.[1]
      )) || "";
    const registration = await getRegistrationByInterviewId(
      msg.chat.id,
      interviewId
    );
    await removeRegistration(
      msg.chat.id,
      (await getInterviewId(msg.chat.id, msg.text?.split(" - ")?.[1])) || ""
    );

    await bot.sendMessage(
      msg.chat.id,
      localisation[chatLang].registrationRemoved
    );

    await sendToChannel(
      threadId || "",
      await getRegistrationText(registration)
    );

    await start(msg);
    return;
  }
});
