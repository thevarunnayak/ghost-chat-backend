import {
  pgTable,
  text,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";

/* ROOMS */
export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* MESSAGES */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  username: text("username").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});