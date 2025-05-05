const express = require("express");
const router = express.Router();
const {
  getAllAddresses,
  addAddress,
  deleteAddress,
} = require("../controllers/addressController");

router.get("/", getAllAddresses);
router.post("/", addAddress);
router.delete("/:id", deleteAddress);

module.exports = router;
