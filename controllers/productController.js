const pool = require("../config/db");

// GET /api/products
const getAllProducts = async (req, res) => {
  const { category, search, limit } = req.query;

  try {
    let query = `
      SELECT 
        p.product_id,
        p.name,
        p.description,
        p.price,
        p.sale_price,
        p.stock_quantity,
        p.image_url,
        p.created_at,
        c.category_name
      FROM cust_products p
      JOIN cust_categories c ON p.category_id = c.category_id
      WHERE 1=1
    `;

    const values = [];

    if (category) {
      values.push(category);
      query += ` AND c.category_name ILIKE $${values.length}`;
    }

    if (search) {
      values.push(`%${search}%`);
      query += ` AND p.name ILIKE $${values.length}`;
    }

    query += ` ORDER BY p.created_at DESC`;

    if (limit) {
      values.push(limit);
      query += ` LIMIT $${values.length}`;
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Get Products Error:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
         p.product_id,
         p.name,
         p.description,
         p.price,
         p.sale_price,
         p.stock_quantity,
         p.image_url,
         p.created_at,
         c.category_name
       FROM cust_products p
       JOIN cust_categories c ON p.category_id = c.category_id
       WHERE p.product_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get Product By ID Error:", err.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};
const getProductsByCategory = async (req, res) => {
    const { name } = req.query;
  
    if (!name) {
      return res.status(400).json({ error: "Category name is required." });
    }
  
    try {
      const result = await pool.query(
        `SELECT 
           p.product_id,
           p.name,
           p.description,
           p.price,
           p.sale_price,
           p.stock_quantity,
           p.image_url,
           p.created_at,
           c.category_name
         FROM cust_products p
         JOIN cust_categories c ON p.category_id = c.category_id
         WHERE c.category_name ILIKE $1
         ORDER BY p.created_at DESC`,
        [name]
      );
  
      res.json(result.rows);
    } catch (err) {
      console.error("Category Product Fetch Error:", err.message);
      res.status(500).json({ error: "Failed to fetch products by category" });
    }
  };
  
module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
};
