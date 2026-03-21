import { Router } from "express";
import { createRoom } from "../services/room.service.js";

const router = Router();

router.post("/create", async (req, res) => {
  try {
    const { ghostMode = false, expireDuration } = req.body;

    const room = await createRoom(ghostMode, expireDuration);
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

export default router;