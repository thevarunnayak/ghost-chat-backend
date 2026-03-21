import { db } from "../db/client.js";
import { messages } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

/* SAVE MESSAGE */
export async function saveMessage(
  roomId: string,
  username: string,
  message: any // 👈 encrypted object from frontend
) {
  await db.insert(messages).values({
    roomId,
    username,
    message: JSON.stringify(message), // ✅ store as string
  });

  // keep only last 100 messages
  const all = await db.query.messages.findMany({
    where: eq(messages.roomId, roomId),
    orderBy: desc(messages.createdAt),
  });

  if (all.length > 100) {
    const extra = all.slice(100);

    for (const msg of extra) {
      await db.delete(messages).where(eq(messages.id, msg.id));
    }
  }
}

/* GET LAST 100 */
export async function getRecentMessages(roomId: string) {
  const msgs = await db.query.messages.findMany({
    where: eq(messages.roomId, roomId),
    orderBy: desc(messages.createdAt),
    limit: 100,
  });

  return msgs
    .map((msg) => ({
      ...msg,
      message: safeParse(msg.message), // ✅ parse back to object
    }))
    .reverse(); // oldest first
}

/* SAFE PARSE (handles old messages too) */
function safeParse(data: string) {
  try {
    return JSON.parse(data);
  } catch {
    return data; // fallback for old plain text
  }
}