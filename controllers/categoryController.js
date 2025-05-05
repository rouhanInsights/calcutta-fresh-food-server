const pool = require("../config/db");

const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM cust_categories ORDER BY category_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get Categories Error:", err.message);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

module.exports = { getAllCategories };
