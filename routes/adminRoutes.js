const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
// const auth = require("../authentication/patientAuth");

router.post("/login", adminController.login);
router.post("/requestCertificates", adminController.requestCertificates);
router.post("/auth-check", adminController.authMiddleware);

router.post(
  "/validateCertificates",
  adminController.acceptOrRejectCertificates
);

router.post("/validateDoctor", adminController.acceptOrRejectDoctor);

router.post("/validatePatient", adminController.acceptOrRejectPatient);

module.exports = router;
