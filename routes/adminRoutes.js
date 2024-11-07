const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.post("/requestCertificates", adminController.requestCertificates);

router.post(
  "/validateCertificates",
  adminController.acceptOrRejectCertificates
);

router.post("/validateDoctor", adminController.acceptOrRejectDoctor);
module.exports = router;
