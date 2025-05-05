const pool = require("../config/db");

const placeOrder = async (req, res) => {
  const {
    user_id,
    address_id,
    payment_method,
    slot_id,
    slot_date,
    items,
  } = req.body;

  // ✅ Validate incoming data
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  try {
    const client = await pool.connect();
    await client.query("BEGIN");

    // ✅ Calculate total price safely
    const total_price = items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      return sum + price * quantity;
    }, 0);

    // ✅ Insert into cust_orders
    const orderResult = await client.query(
      `INSERT INTO cust_orders 
       (user_id, total_price, status, order_date, payment_method, slot_id, slot_date, address_id)
       VALUES ($1, $2, 'confirmed', NOW(), $3, $4, $5, $6)
       RETURNING order_id`,
      [user_id, total_price, payment_method, slot_id, slot_date, address_id]
    );

    const order_id = orderResult.rows[0].order_id;

    console.log("✅ Creating order:", { order_id, user_id, items });

    // ✅ Insert into cust_order_items with product_id check
    for (const item of items) {
      const productId = Number(item.product_id || item.id);

      if (!productId || isNaN(productId)) {
        console.log("❌ Invalid product_id in item:", item);
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Invalid product_id in one of the items" });
      }

      await client.query(
        `INSERT INTO cust_order_items 
         (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [order_id, productId, item.quantity || 1, item.price || 0]
      );
    }

    await client.query("COMMIT");
    client.release();

    console.log("🚀 Order placed successfully:", order_id);
    res.status(201).json({ message: "Order placed successfully", order_id });

  } catch (err) {
    console.error("Order placement failed:", err.message);
    res.status(500).json({ error: "Order failed" });
  }
};
const getUserOrders = async (req, res) => {
    const { id: user_id } = req.params;
  
    try {
      const result = await pool.query(
        `
        SELECT 
          o.order_id,
          o.total_price,
          o.status,
          o.order_date,
          o.payment_method,
          o.slot_id,
          o.slot_date,
          o.address_id,
          a.name AS address_name,
          a.phone AS address_phone,
          a.address_line1,
          a.city,
          a.state,
          a.pincode,
          json_agg(
            json_build_object(
              'product_id', p.product_id,
              'name', p.name,
              'image_url', p.image_url,
              'price', i.price,
              'quantity', i.quantity
            )
          ) AS items
        FROM cust_orders o
        JOIN cust_order_items i ON o.order_id = i.order_id
        JOIN cust_products p ON i.product_id = p.product_id
        LEFT JOIN cust_addresses a ON o.address_id = a.address_id
        WHERE o.user_id = $1
        GROUP BY o.order_id, a.address_id
        ORDER BY o.order_date DESC
        `,
        [user_id]
      );
  
      res.json(result.rows);
    } catch (err) {
      console.error("Order history error:", err.message);
      res.status(500).json({ error: "Failed to fetch order history" });
    }
  };
  const getOrderById = async (req, res) => {
    const { id: order_id } = req.params;
  
    try {
      const result = await pool.query(
        `
        SELECT 
          o.order_id,
          o.total_price,
          o.status,
          o.order_date,
          o.payment_method,
          o.slot_id,
          o.slot_date,
          o.address_id,
          a.name AS address_name,
          a.phone AS address_phone,
          a.address_line1,
          a.city,
          a.state,
          a.pincode,
          json_agg(
            json_build_object(
              'product_id', p.product_id,
              'name', p.name,
              'image_url', p.image_url,
              'price', i.price,
              'quantity', i.quantity
            )
          ) AS items
        FROM cust_orders o
        JOIN cust_order_items i ON o.order_id = i.order_id
        JOIN cust_products p ON i.product_id = p.product_id
        LEFT JOIN cust_addresses a ON o.address_id = a.address_id
        WHERE o.order_id = $1
        GROUP BY o.order_id, a.address_id
        `,
        [order_id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Order not found" });
      }
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Get Order By ID Error:", err.message);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  };
  const PDFDocument = require("pdfkit");
const fs = require("fs");

const getOrderInvoice = async (req, res) => {
  const { id: order_id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        o.order_id,
        o.total_price,
        o.status,
        o.order_date,
        o.payment_method,
        a.name AS address_name,
        a.phone AS address_phone,
        a.address_line1,
        a.city,
        a.state,
        a.pincode,
        json_agg(
          json_build_object(
            'product_id', p.product_id,
            'name', p.name,
            'image_url', p.image_url,
            'price', i.price,
            'quantity', i.quantity
          )
        ) AS items
      FROM cust_orders o
      JOIN cust_order_items i ON o.order_id = i.order_id
      JOIN cust_products p ON i.product_id = p.product_id
      LEFT JOIN cust_addresses a ON o.address_id = a.address_id
      WHERE o.order_id = $1
      GROUP BY o.order_id, a.address_id
      `,
      [order_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = result.rows[0];

    // Create a PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.order_id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("Calcutta Fresh Foods", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice #${order.order_id}`);
    doc.text(`Date: ${new Date(order.order_date).toLocaleDateString()}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Payment: ${order.payment_method}`);
    doc.moveDown();

    // Address
    doc.fontSize(14).text("Shipping Address:");
    doc.fontSize(12).text(`${order.address_name}`);
    doc.text(`${order.address_line1}, ${order.city}, ${order.state} - ${order.pincode}`);
    doc.text(`Phone: ${order.address_phone}`);
    doc.moveDown();

    // Items
    doc.fontSize(14).text("Order Items:");
    doc.moveDown();
    order.items.forEach((item) => {
      doc.fontSize(12).text(`${item.name} - ₹${item.price} x ${item.quantity}`);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: ₹${order.total_price}`, { align: "right" });

    doc.end();
  } catch (err) {
    console.error("Invoice generation error:", err.message);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
};

module.exports = {
    placeOrder,
    getUserOrders,
    getOrderById,
    getOrderInvoice,
  };