import { db } from "../db/client.js";
import { messages } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { encrypt, decrypt } from "../lib/crypto.js";

/* SAVE MESSAGE */
export async function saveMessage(
  roomId: string,
  username: string,
  message: string
) {
  // 🔐 encrypt before storing
  const encryptedMessage = encrypt(message);

  await db.insert(messages).values({
    roomId,
    username,
    message: encryptedMessage, // ✅ FIXED
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

  // 🔓 decrypt before sending to client
  const decrypted = msgs.map((msg) => ({
    ...msg,
    message: decrypt(msg.message), // ✅ FIXED
  }));

  return decrypted.reverse(); // oldest first
}