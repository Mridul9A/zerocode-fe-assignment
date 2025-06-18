import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";
import botRoutes from "./routes/bot.js";

dotenv.config();

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5002;

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5174", // or your deployed frontend domain
    credentials: true,
  })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/bot", botRoutes);

// Serve static frontend files in production
if (process.env.NODE_ENV === "production") {
  console.log("Production mode — API only. Frontend is deployed separately.");
}

app.get("/", (req, res) => {
  res.redirect("http://localhost:5174");
});




server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});

