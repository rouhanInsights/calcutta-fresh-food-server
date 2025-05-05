const pool = require("../config/db");
const jwt = require("jsonwebtoken");

// In-memory OTP store (for mock)
const otpStore = new Map();

// 🔐 Replace this with env variable in production
const JWT_SECRET = "mysecretkey";

// Send OTP (mock)
const sendOtp = async (req, res) => {
  const { phone, email } = req.body;

  if (!phone && !email) {
    return res.status(400).json({ error: "Phone or email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save to map
  const key = phone || email;
  otpStore.set(key, otp);

  console.log(`✅ OTP sent to ${key}: ${otp}`);

  res.json({ message: `OTP sent to ${key}` });
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { phone, email, otp } = req.body;
  const key = phone || email;

  const storedOtp = otpStore.get(key);

  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).json({ error: "Invalid OTP" });
  }

  // Check if user exists
  let user;
  const query = phone
    ? "SELECT * FROM cust_users WHERE phone = $1"
    : "SELECT * FROM cust_users WHERE email = $1";
  const value = [key];
  const result = await pool.query(query, value);

  if (result.rows.length > 0) {
    user = result.rows[0];
  } else {
    // Create user if not exists
    const insertQuery = phone
      ? "INSERT INTO cust_users (phone) VALUES ($1) RETURNING *"
      : "INSERT INTO cust_users (email) VALUES ($1) RETURNING *";
    const insertResult = await pool.query(insertQuery, value);
    user = insertResult.rows[0];
  }

  // Generate JWT
  const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: "7d" });

  otpStore.delete(key);

  res.json({
    message: "OTP verified successfully",
    token,
    user,
  });
};

module.exports = { sendOtp, verifyOtp };
