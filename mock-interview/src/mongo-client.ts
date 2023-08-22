import { MongoClient } from "mongodb";
import { getEnv } from "./constants";

const env = getEnv();
const mongodbClient = new MongoClient(env.ME_CONFIG_MONGODB_URL);
mongodbClient.connect();

const db = mongodbClient.db("mock_interview");
const afishaSchoolDb = mongodbClient.db("afisha_school");

export type Registration = {
  telegramChatId: number;
  discordChatId: string;
  role: "interviewer" | "interviewee";
  language: "ru" | "en" | "noImportant";
  typeOfInterview: "hr" | "algo" | "behavioral";
  state: "registration" | "waitingForInterview" | "interview" | "done";
  interviewId: string;
};

export type ChatState = {
  chatId: number;
  discordChatId: string;
  discordGuildId?: string;

  registrations: Registration[];
  activeRegistration: Registration["interviewId"] | null;
  inveteId?: string;
  discordUserId?: string;
};

export type GuildInvites = {
  id: string;
  uses: number | null;
};

const afishaGuildCollection =
  afishaSchoolDb.collection<GuildInvites>("guild_invites");

const getInitChatValue = (telegramChatId: number): ChatState => ({
  chatId: telegramChatId,
  discordChatId: "",
  registrations: [],
  activeRegistration: null,
});

export const initChatState = async (chatId: number) => {
  await db.collection("chats").insertOne(getInitChatValue(chatId));
};

export const getChatState = async (chatId: number) => {
  const chatState = await db.collection("chats").findOne<ChatState>({ chatId });
  if (!chatState) {
    await initChatState(chatId);
    return getInitChatValue(chatId);
  }
  return chatState;
};

export const updateChatState = async (
  chatId: number,
  registration: { interviewId: string } & Partial<Registration>
) => {
  const chatState = await getChatState(chatId);

  const registrationIndex = chatState.registrations.findIndex(
    (x) => x.interviewId === registration.interviewId
  );
  if (registrationIndex === -1) {
    chatState.registrations.push(registration as Registration);
  } else {
    chatState.registrations[registrationIndex] = {
      ...chatState.registrations[registrationIndex],
      ...registration,
    };
  }
  await db.collection("chats").updateOne({ chatId }, { $set: chatState });
};

export const updateActiveRegistration = async (
  chatId: number,
  interviewId: string | null
) => {
  const chatState = await getChatState(chatId);
  if (!chatState) {
    return;
  }

  chatState.activeRegistration = interviewId;
  await db.collection("chats").updateOne({ chatId }, { $set: chatState });
};

export const getActiveRegistration = async (chatId: number) => {
  const chatState = await getChatState(chatId);
  if (!chatState) {
    return;
  }

  return chatState.registrations.find(
    (x) => x.interviewId === chatState.activeRegistration
  );
};

const updateRegistrationsList = async (
  chatId: number,
  registrations: Registration[]
) => {
  const chatState = await getChatState(chatId);
  if (!chatState) {
    return;
  }
  chatState.registrations = registrations;
};

export const removeRegistration = async (
  chatId: number,
  interviewId: string
): Promise<void> => {
  const chatState = await getChatState(chatId);
  if (!chatState) {
    return;
  }
  const registrationIndex = chatState.registrations.findIndex(
    (x) => x.interviewId === interviewId
  );
  if (registrationIndex === -1) {
    return;
  }
  const [removedRegistration] = chatState.registrations.splice(
    registrationIndex,
    1
  );
  await db.collection("chats").updateOne({ chatId }, { $set: chatState });
};

export const getDiscordThreadId = async (chatId: number) => {
  const chatState = await db.collection("chats").findOne<ChatState>({ chatId });
  if (!chatState) {
    return;
  }

  return chatState.discordChatId;
};

export const getGuildId = async (chatId: number) => {
  const chatState = await db.collection("chats").findOne<ChatState>({ chatId });
  if (!chatState) {
    return;
  }

  return chatState.discordGuildId;
};

export const setDiscordThreadId = async (chatId: number, threadId: string) => {
  await db
    .collection("chats")
    .updateOne({ chatId }, { $set: { discordChatId: threadId } });
};

export const getAllDiscordThreadsIds = async () => {
  const chatStates = await db.collection("chats").find<ChatState>({}).toArray();
  return chatStates.map((x) => x.discordChatId);
};

export const getTelegramChatIdByDiscordThreadId = async (
  threadId: string
): Promise<number | null> => {
  const chatState = await db
    .collection("chats")
    .findOne<ChatState>({ discordChatId: threadId });
  if (!chatState) {
    return null;
  }
  return chatState.chatId;
};

export const getRegistrationByInterviewId = async (
  chatId: number,
  interviewId: string
) => {
  const chatState = await getChatState(chatId);
  if (!chatState) {
    return;
  }
  return chatState.registrations.find((x) => x.interviewId === interviewId);
};

export const getAllChats = async () => {
  const chatStates = await db.collection("chats").find<ChatState>({}).toArray();
  return chatStates;
};

export const setInvite = async (chatId: number, inveteId: string) => {
  await db.collection<ChatState>("chats").updateOne(
    { chatId },
    {
      $set: {
        inveteId,
      },
    }
  );
};

export const setDiscordUserId = async (chatId: number, discordUserId: string) => {
  await db.collection<ChatState>("chats").updateOne(
    { chatId },
    {
      $set: {
        discordUserId,
      },
    }
  );
}

export const getInviteWithUserIdPairs = async () => {
  const chatStates = await db.collection<ChatState>("chats").find({}).toArray();
  return chatStates
    .filter((x) => x.inveteId)
    .map((x) => ({ inveteId: x.inveteId, chatId: x.chatId }));
};

export const setUses = async (uses: GuildInvites[]) => {
  await afishaGuildCollection.deleteMany({});
  await afishaGuildCollection.insertMany(uses);
};

export const getUses = async () => {
  const uses = await afishaGuildCollection.find({}).toArray();
  return uses;
};

export { mongodbClient };
