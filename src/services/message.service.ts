import { db } from "../db/client.js";
import { messages, rooms } from "../db/schema.js";
import { eq, desc, and, gt, isNull, or } from "drizzle-orm";

/* SAVE MESSAGE */
export async function saveMessage(
  roomId: string,
  username: string,
  message: any
) {
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
  });

  let expiresAt = null;

  if (room?.ghostMode && room.expireDuration) {
    expiresAt = new Date(Date.now() + room.expireDuration);
  }

  await db.insert(messages).values({
    roomId,
    username,
    message: JSON.stringify(message),
    expiresAt,
  });

  /* 🧹 DELETE EXPIRED MESSAGES */
  await db.delete(messages).where(
    and(
      eq(messages.roomId, roomId),
      gt(messages.expiresAt, new Date()) // expired
    )
  );

  /* keep only last 100 */
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
    where: and(
      eq(messages.roomId, roomId),
      or(
        isNull(messages.expiresAt),
        gt(messages.expiresAt, new Date()) // not expired
      )
    ),
    orderBy: desc(messages.createdAt),
    limit: 100,
  });

  return msgs
    .map((msg) => ({
      ...msg,
      message: safeParse(msg.message),
    }))
    .reverse();
}

/* SAFE PARSE (handles old messages too) */
function safeParse(data: string) {
  try {
    return JSON.parse(data);
  } catch {
    return data; // fallback for old plain text
  }
}