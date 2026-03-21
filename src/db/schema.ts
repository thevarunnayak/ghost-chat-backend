import {
  pgTable,
  text,
  timestamp,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

/* ROOMS */
export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),

  ghostMode: boolean("ghost_mode").default(false), // 🆕
  expireDuration: integer("expire_duration"), // ms 🆕

  createdAt: timestamp("created_at").defaultNow(),
});

/* MESSAGES */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  username: text("username").notNull(),
  message: text("message").notNull(),

  expiresAt: timestamp("expires_at"), // 🆕

  createdAt: timestamp("created_at").defaultNow(),
});