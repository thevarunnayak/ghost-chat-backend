import { db } from "../db/client";
import { messages } from "../db/schema";
import { eq, desc } from "drizzle-orm";

/* SAVE MESSAGE */
export async function saveMessage(
  roomId: string,
  username: string,
  message: string
) {
  await db.insert(messages).values({
    roomId,
    username,
    message,
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

  return msgs.reverse(); // oldest first
}