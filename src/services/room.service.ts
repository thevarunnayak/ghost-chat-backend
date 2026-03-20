import { db } from "../db/client";
import { rooms } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateRoomId, generatePassword } from "../utils/generate";

/* CREATE ROOM */
export async function createRoom() {
  const roomId = generateRoomId();
  const password = generatePassword();

  const passwordHash = await hashPassword(password);

  await db.insert(rooms).values({
    id: roomId,
    passwordHash,
  });

  return { roomId, password };
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