const Razorpay = require("razorpay");

const createPaymentOrder = async (req, res) => {
  const { amount } = req.body;

  try {
    const razorpay = new Razorpay({
      key_id: "rzp_test_dummy", // ✅ your Razorpay test key
      key_secret: "rzp_test_secret"
    });

    const options = {
      amount: amount * 100, // Razorpay requires paise
      currency: "INR",
      receipt: `order_rcptid_${Math.floor(Math.random() * 10000)}`
    };

    const order = await razorpay.orders.create(options);
    res.json({
      order_id: order.id,
      currency: order.currency,
      amount: order.amount
    });
  } catch (err) {
    console.error("Razorpay create error:", err.message);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
};

module.exports = {
  createPaymentOrder // ✅ This line is critical
};
