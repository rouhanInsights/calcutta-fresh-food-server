const pool = require("../config/db");

// Hardcoded user ID for dev — replace later with token-based logic
const userId = 17;

const getAllAddresses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM cust_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get Addresses Error:", err.message);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
};

const addAddress = async (req, res) => {
  const {
    name,
    phone,
    address_line1,
    address_line2,
    address_line3,
    city,
    state,
    pincode,
    is_default = false,
  } = req.body;

  try {
    // Optional: make all others non-default
    if (is_default) {
      await pool.query(`UPDATE cust_addresses SET is_default = false WHERE user_id = $1`, [userId]);
    }

    const result = await pool.query(
      `INSERT INTO cust_addresses 
        (user_id, name, phone, address_line1, address_line2, address_line3, city, state, pincode, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        name,
        phone,
        address_line1,
        address_line2,
        address_line3,
        city,
        state,
        pincode,
        is_default,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Add Address Error:", err.message);
    res.status(500).json({ error: "Failed to add address" });
  }
};

const deleteAddress = async (req, res) => {
  const addressId = req.params.id;

  try {
    const result = await pool.query(
      `DELETE FROM cust_addresses WHERE address_id = $1 AND user_id = $2 RETURNING *`,
      [addressId, 17] // replace with dynamic user ID later
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Address not found or already deleted." });
    }

    res.json({ message: "Address deleted", address: result.rows[0] });
  } catch (err) {
    console.error("❌ Delete Address Error:", err.message);
    res.status(500).json({ error: "Failed to delete address" });
  }
};



module.exports = {
  getAllAddresses,
  addAddress,
  deleteAddress,
};
