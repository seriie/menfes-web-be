const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const queryDb = require("../helper/query");
require("dotenv").config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "qwerty12345";

router.post("/register", async (req, res) => {
  const { username, email, password, birthday, fullname } = req.body;

  if (!username || !email || !password || !birthday || !fullname) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const date = new Date().toISOString().slice(0, 10).replace("T", " ");
    const time = new Date().toLocaleTimeString();
    const joinDate = `${date} ${time}`;

    // Check if username or email already exists
    const checkUser = "SELECT * FROM users WHERE username = ? OR email = ?";
    const results = await queryDb(checkUser, [username, email]);

    if (results.length > 0) {
      const existingField = results[0].username === username ? "Username" : "Email";
      return res.status(400).json({ message: `${existingField} already exists!` });
    }

    // Insert user data into database
    const sql =
      "INSERT INTO users (username, email, password, join_date, birth_day, fullname) VALUES (?, ?, ?, ?, ?, ?)";
    await queryDb(sql, [username, email, hashedPassword, joinDate, birthday, fullname]);

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Error during registration:", err.message);
    res.status(500).json({ message: "An error occurred!", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please fill email and password" });
  }

  try {
    const sql = "SELECT * FROM users WHERE email = ?";
    const results = await queryDb(sql, [email]);

    if (results.length === 0) {
      return res.status(400).json({ message: "Email not found" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: "Login successful",
      userId: user.id,
      token,
    });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;