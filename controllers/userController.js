const pool = require("../config/db");

// ✅ Get user profile
const getUserProfile = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cust_users LIMIT 1");
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Update user profile (cleaned)
const updateUserProfile = async (req, res) => {
  const userId = 17; // Replace with JWT user later

  const {
    name,
    phone,
    alt_phone,
    email,
    alt_email,
    dob,
    gender,
    profile_image_url
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE cust_users
       SET
         name = $1,
         phone = $2,
         alt_phone = $3,
         email = $4,
         alt_email = $5,
         dob = $6,
         gender = $7,
         profile_image_url = $8
       WHERE user_id = $9
       RETURNING *`,
      [
        name,
        phone,
        alt_phone || null,
        email,
        alt_email || null,
        dob || null,
        gender || null,
        profile_image_url || null,
        userId
      ]
    );

    res.json({
      message: "Profile updated successfully.",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Update Profile Error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile
};
