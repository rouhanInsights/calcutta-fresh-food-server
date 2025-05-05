const express = require("express");
const router = express.Router();

// ✅ Import both controllers
const {
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");

// ✅ Routes
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);

module.exports = router;
