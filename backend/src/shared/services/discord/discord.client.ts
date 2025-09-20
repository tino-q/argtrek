/* eslint-disable no-unused-vars */
import { GatewayIntentBits, Client } from "discord.js";
import type {
  APIEmbed,
  TextChannel,
  GuildMember,
  Guild,
  UserManager,
  ChannelManager,
  Channel,
  User,
  Message,
  GuildManager,
  GuildMemberManager,
} from "discord.js";
import { DISCORD_TOKEN, GUILD_ID } from "./discord.env";

let client: Client | undefined;

function coolErrorHandler(error: any, message: string): void {
  console.error(message, error);
}

function internalError(code: string, message: string): Error {
  const errorMessage = `[${code}]: ${message}`;
  console.error(errorMessage);
  return new Error(errorMessage);
}

function sendErrorToTinqueAsEmail(error: any): void {
  console.error("Error sending error to tinque as email:", error);
}

async function botLogin(): Promise<void> {
  try {
    if (client === undefined) {
      client = new Client({ intents: [GatewayIntentBits.Guilds] });
      
      // Add error handlers to prevent unhandled promise rejections
      client.on('error', (error) => {
        console.error('Discord client error:', error);
      });
      
      client.on('warn', (warning) => {
        console.warn('Discord client warning:', warning);
      });
      
      await client.login(DISCORD_TOKEN);
    }
  } catch (error) {
    coolErrorHandler(error as any, "discord:client:botLogin");
    client = undefined;
  }
}

async function withClient<T>(
  callback: (...args: [Client]) => Promise<T>
): Promise<T> {
  await botLogin();

  if (!client) {
    throw internalError("3b4058dc", "Discord client is not available");
  }

  return callback(client);
}

function splitInHalfByNewLines(message: string): string[] {
  const messageLines = message.split("\n");
  if (messageLines.length === 1) {
    const half = Math.ceil(message.length / 2);
    return [message.slice(0, half), message.slice(half)];
  }

  const half = Math.ceil(messageLines.length / 2);
  const firstHalf = messageLines
    .filter((_: string, i: number): boolean => i < half)
    .join("\n");

  const secondHalf = messageLines
    .filter((_: string, i: number): boolean => i >= half)
    .join("\n");

  return [firstHalf, secondHalf];
}

async function doFetch(
  service: UserManager | ChannelManager | GuildManager | GuildMemberManager,
  id: string
): Promise<User | Channel | Guild | GuildMember | null | undefined> {
  try {
    const cached = service.cache.get(id);
    if (cached) {
      return cached as any;
    }
    return (await service.fetch(id)) as any;
  } catch (error) {
    if ((error as any).status !== 404) {
      throw error;
    }
    return undefined;
  }
}

export const botMessageTo = async (
  id: string,
  type: "users" | "channels",
  message: string,
  embeds: APIEmbed[] = [],
  components: any[] = []
): Promise<Message | null> => {
  console.log(
    `[botMessageTo]: embeds:${embeds.length} [${type}]: ${message}`.replace(
      /\n/g,
      " "
    )
  );

  if (!DISCORD_TOKEN) {
    console.error("DISCORD_TOKEN not set; skipping Discord send");
    return null;
  }

  return withClient(async (client: Client): Promise<Message | null> => {
    const service = (client as any)[type] as UserManager | ChannelManager;
    const channel = (await doFetch(service, id)) as TextChannel;
    if (!channel) {
      throw internalError("3c4018dc", `Discord channel ${id} is not available`);
    }

    if (message.length === 0 && embeds.length === 0) {
      return null;
    }

    const maxMessageLength = 1900;

    if (message.length <= maxMessageLength) {
      return (await channel.send({
        content: message,
        embeds,
        components,
      })) as any;
    } else {
      const [firstHalf, secondHalf] = splitInHalfByNewLines(message);
      const firstMessage = await botMessageTo(
        id,
        type,
        firstHalf as string,
        embeds
      );
      await botMessageTo(id, type, secondHalf as string, embeds);
      return firstMessage;
    }
  }).catch((error: any) => {
    sendErrorToTinqueAsEmail(error);
    return null;
  });
};

export async function getGuild(guildId: string): Promise<Guild> {
  return withClient(async (client: Client): Promise<Guild> => {
    const service = client.guilds;
    const guild = (await doFetch(service as any, guildId)) as Guild;
    if (!guild) {
      throw internalError(
        "2a3016dc",
        `Discord guild ${guildId} is not available`
      );
    }
    return guild;
  });
}

export async function getGuildMember(
  userId: string
): Promise<GuildMember | undefined> {
  const guild = await getGuild(GUILD_ID);
  const service = guild.members;
  return (await doFetch(service as any, userId)) as GuildMember;
}

export async function getMessageById(
  channelId: string,
  messageId: string
): Promise<Message | null> {
  return withClient(async (client: Client): Promise<Message | null> => {
    const channel = (await doFetch(
      client.channels as any,
      channelId
    )) as TextChannel;
    if (!channel) {
      throw internalError(
        "4d5018dc",
        `Discord channel ${channelId} is not available`
      );
    }
    try {
      return (await channel.messages.fetch(messageId)) as any;
    } catch (error) {
      if ((error as any).status !== 404) {
        throw error;
      }
      return null;
    }
  });
}

export async function clearAllMessagesInChannel(
  channelId: string
): Promise<void> {
  await withClient(async (client: Client) => {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      console.error(
        `Channel with ID ${channelId} not found or is not text-based.`
      );
      return;
    }

    let messages: Message[];
    do {
      messages = (await (channel as any).messages.fetch({
        limit: 100,
      })) as unknown as Message[];
      await Promise.all(messages.map((message: Message) => message.delete()));
    } while (messages.length > 0);

    console.log(`All messages in channel ${channelId} have been cleared.`);
  });
}
