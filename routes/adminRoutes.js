

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.post("/requestCertificates", adminController.requestCertificates);

module.exports = router;
