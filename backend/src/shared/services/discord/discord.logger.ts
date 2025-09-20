import { botMessageTo } from "./discord.client";
import { ARG_TRIP_CHANNEL_ID } from "./discord.env";

function serializeError(err: any) {
  if (!(err instanceof Error)) {
    try {
      return JSON.stringify(err, null, 2);
    } catch {
      return String(err);
    }
  }
  return JSON.stringify(
    {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    null,
    2
  );
}

export async function discordLog(message: string) {
  try {
    if (!ARG_TRIP_CHANNEL_ID) {
      console.error("ARG_TRIP_CHANNEL_ID not set; skipping discordLog");
      return null;
    }
    const result = await botMessageTo(ARG_TRIP_CHANNEL_ID, "channels", message);
    return result;
  } catch (error) {
    console.error("Error logging to discord", error);
    return null;
  }
}

export async function discordErrorLog(message: string, error: any) {
  return discordLog(message + ": " + serializeError(error));
}
