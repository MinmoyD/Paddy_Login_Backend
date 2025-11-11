import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser"; 
import usermodel from "../models/user.model.js";

const router = express.Router();

// Use cookie-parser middleware (if not already added globally)
router.use(cookieParser());

// --- Login Route ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Please enter all fields", redirect: "/api/register" });
  }

  try {
    // Find user
    const user = await usermodel.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User does not exist" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Store token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,      
      secure: process.env.NODE_ENV === "production", // only over HTTPS in production
      sameSite: "strict",  
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    // Send response
    res.json({
      msg: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error("Error in login", error);
    return res.status(500).json({ msg: "Server Error" });
  }
});

export default router;
