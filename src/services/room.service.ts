import { db } from "../db/client.js";
import { rooms } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateRoomId, generatePassword } from "../utils/generate.js";

/* CREATE ROOM */
export async function createRoom(
  ghostMode = false,
  expireDuration?: number
) {
  const roomId = generateRoomId();
  const password = generatePassword();

  const passwordHash = await hashPassword(password);

  // default = 1 hour
  const finalDuration = ghostMode
    ? expireDuration || 60 * 60 * 1000
    : null;

  await db.insert(rooms).values({
    id: roomId,
    passwordHash,
    ghostMode,
    expireDuration: finalDuration,
  });

  return { roomId, password, ghostMode, expireDuration: finalDuration };
}

/* VALIDATE ROOM */
export async function validateRoom(roomId: string, password: string) {
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
  });

  if (!room) return { valid: false, reason: "Room not found" };

  const isValid = await comparePassword(password, room.passwordHash);

  if (!isValid) return { valid: false, reason: "Invalid password" };

  return { valid: true };
}