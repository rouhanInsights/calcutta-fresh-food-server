const express = require("express");
const router = express.Router();
const { placeOrder, getUserOrders, getOrderById  } = require("../controllers/orderController");
const { getOrderInvoice } = require("../controllers/orderController");
router.post("/", placeOrder);
router.get("/:id", getOrderById);
router.get("/user/:id", getUserOrders);
router.get("/:id/invoice", getOrderInvoice);
module.exports = router;
