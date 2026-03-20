import { WebSocket } from "ws";

type Room = {
  clients: Set<WebSocket>;
  users: Set<string>;
  lastActiveAt: number;
};

const rooms = new Map<string, Room>();

export function getRoom(roomId: string) {
  return rooms.get(roomId);
}

export function createRoomIfNotExists(roomId: string) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Set(),
      users: new Set(),
      lastActiveAt: Date.now(),
    });
  }
}

export function deleteRoom(roomId: string) {
  rooms.delete(roomId);
}

export function getAllRooms() {
  return rooms;
}