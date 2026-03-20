import { Router } from "express";
import { createRoom } from "../services/room.service";

const router = Router();

router.post("/create", async (req, res) => {
  try {
    const room = await createRoom();
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

export default router;