import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import usermodel from "../models/user.model.js";

const router = express.Router();

// -----------------------------------------------------------
// Middleware
// -----------------------------------------------------------
router.use(cookieParser());

// -----------------------------------------------------------
// POST /api/login
// -----------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Input validation
    if (!email || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }

    // 2️⃣ Check user existence
    const user = await usermodel.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    // 3️⃣ Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // 4️⃣ Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5️⃣ Store token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    // 6️⃣ Send response
    res.status(200).json({
      msg: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
      },
      token, // optional — helps frontends not using cookies
    });
  } catch (error) {
    console.error("❌ Error in /login:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

// -----------------------------------------------------------
// (Optional) GET /api/logout
// -----------------------------------------------------------
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ msg: "Logged out successfully" });
});

export default router;
