import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";

import usermodel from "../models/user.model.js";
import authRoutes from "../routers/auth.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const app = express();

// ---------------------------- MIDDLEWARE ---------------------------- //
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5174",
    credentials: true,
  })
);
app.use(express.json());

// ---------------------------- TEST DATA ---------------------------- //
const jokes = [
  { id: 1, setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
  { id: 2, setup: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field!" },
  { id: 3, setup: "Why don't skeletons fight each other?", punchline: "They don't have the guts." },
  { id: 4, setup: "What do you call fake spaghetti?", punchline: "An impasta!" },
  { id: 5, setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired!" },
];

// ---------------------------- ALL ROUTES ---------------------------- //
app.get("/", (req, res) => {
  res.send("✅ API is running on Vercel...");
});

app.get("/api/jokes", (req, res) => {
  res.json(jokes);
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await usermodel.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

app.get("/api/dashboard", authMiddleware, (req, res) => {
  res.json({ msg: `Welcome ${req.user.email}, you are in the dashboard 🚀` });
});

// ---------------------------- REGISTER ---------------------------- //
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ msg: "Please enter all fields" });

  try {
    const existingUser = await usermodel.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new usermodel({ name, email, password: hashedPassword });
    const savedUser = await newUser.save();

    res.json({
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// --- Auth Routes (login, verify, etc.) ---
app.use("/api", authRoutes);

// ---------------------------- DATABASE CONNECT ---------------------------- //
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------------------------- EXPORT FOR VERCEL ---------------------------- //
export default app;
