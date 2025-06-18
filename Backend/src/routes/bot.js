import express from "express";
const router = express.Router();

router.post("/chat", (req, res) => {
  const { message } = req.body;
  const botResponse = `🤖 Bot reply: ${message}`;
  setTimeout(() => {
    res.json({ senderId: "bot", text: botResponse, createdAt: new Date().toISOString() });
  }, 1000);
});

export default router;
