const pool = require("../config/db");

const getalladdress = async (req, res) => {
  const userId = req.user.userId;

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

const addaddress = async (req, res) => {
  const userId = req.user.userId;
  const {
    name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pincode,
    is_default = false,
    floor_no,
    landmark,
  } = req.body;

  try {
    if (is_default) {
      await pool.query(
        `UPDATE cust_addresses SET is_default = false WHERE user_id = $1`,
        [userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO cust_addresses 
        (user_id, name, phone, address_line1, address_line2, city, state, pincode, is_default, floor_no, landmark) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *`,
      [
        userId,
        name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        is_default,
        floor_no,
        landmark,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Add Address Error:", err.message);
    res.status(500).json({ error: "Failed to add address" });
  }
};

const deleteaddress = async (req, res) => {
  const userId = req.user.userId;
  const addressId = req.params.id;

  try {
    const result = await pool.query(
      `DELETE FROM cust_addresses WHERE address_id = $1 AND user_id = $2 RETURNING *`,
      [addressId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: "Unauthorized delete attempt" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete Address Error:", err.message);
    res.status(500).json({ error: "Failed to delete address" });
  }
};

module.exports = {
  getalladdress,
  addaddress,
  deleteaddress,
};
