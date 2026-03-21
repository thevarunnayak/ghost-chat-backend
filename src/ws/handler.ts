import { WebSocket } from "ws";
import { createRoomIfNotExists, getRoom, deleteRoom } from "./rooms.js";

import { validateRoom } from "../services/room.service.js";
import { saveMessage, getRecentMessages } from "../services/message.service.js";
import { db } from "../db/client.js";
import { eq } from "drizzle-orm";
import { rooms } from "../db/schema.js";

export function handleWebSocket(ws: WebSocket) {
  (ws as any).lastMessageTime = 0;

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      /* ================= JOIN ================= */
      if (msg.type === "join") {
        const { roomId, password, username } = msg;

        // 1. validate DB
        const result = await validateRoom(roomId, password);

        if (!result.valid) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: result.reason,
            }),
          );
          return;
        }

        // 2. in-memory room
        createRoomIfNotExists(roomId);
        const room = getRoom(roomId);
        if (!room) return;

        // 3. username check
        if (room.users.has(username)) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Username already taken",
            }),
          );
          return;
        }

        // 4. join
        room.clients.add(ws);
        room.users.add(username);
        broadcastSystemMessage(roomId, `${username} joined`);
        (ws as any).roomId = roomId;
        (ws as any).username = username;

        room.lastActiveAt = Date.now();

        // 5. send history
        const history = await getRecentMessages(roomId);

        ws.send(
          JSON.stringify({
            type: "history",
            messages: history,
          }),
        );

        // 6. broadcast users
        broadcastUsers(roomId);
      }

      /* ================= MESSAGE ================= */
      if (msg.type === "message") {
        const now = Date.now();

        if (now - (ws as any).lastMessageTime < 500) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Too fast",
            }),
          );
          return;
        }

        (ws as any).lastMessageTime = now;

        const roomId = (ws as any).roomId;
        const username = (ws as any).username;

        const room = getRoom(roomId);
        if (!room) return;

        room.lastActiveAt = Date.now();

        // 🔥 fetch room config
        const dbRoom = await db.query.rooms.findFirst({
          where: eq(rooms.id, roomId),
        });

        let expiresAt = null;

        if (dbRoom?.ghostMode && dbRoom.expireDuration) {
          expiresAt = new Date(Date.now() + dbRoom.expireDuration).toISOString();
        }

        // 1. save to DB
        await saveMessage(roomId, username, msg.message);

        // 2. broadcast
        for (const client of room.clients) {
          client.send(
            JSON.stringify({
              type: "message",
              username,
              message: msg.message,
              createdAt: new Date().toISOString(),
              expiresAt, // 💣 IMPORTANT
            }),
          );
        }
      }

      /* ================= TYPING ================= */
      if (msg.type === "typing") {
        const roomId = (ws as any).roomId;
        const username = (ws as any).username;

        const room = getRoom(roomId);
        if (!room) return;

        for (const client of room.clients) {
          if (client !== ws) {
            client.send(
              JSON.stringify({
                type: "typing",
                username,
              }),
            );
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  ws.on("close", () => {
    const roomId = (ws as any).roomId;
    const username = (ws as any).username;

    if (!roomId) return;

    const room = getRoom(roomId);
    if (!room) return;

    room.clients.delete(ws);
    room.users.delete(username);
    broadcastSystemMessage(roomId, `${username} left`);

    if (room.users.size === 0) {
      deleteRoom(roomId);
    } else {
      broadcastUsers(roomId);
    }
  });
}

function broadcastUsers(roomId: string) {
  const room = getRoom(roomId);
  if (!room) return;

  const users = Array.from(room.users);

  for (const client of room.clients) {
    client.send(
      JSON.stringify({
        type: "users_update",
        users,
      }),
    );
  }
}

function broadcastSystemMessage(roomId: string, message: string) {
  const room = getRoom(roomId);
  if (!room) return;

  for (const client of room.clients) {
    client.send(
      JSON.stringify({
        type: "system",
        message,
        createdAt: new Date().toISOString(),
      }),
    );
  }
}

