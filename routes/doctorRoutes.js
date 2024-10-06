const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const auth = require("../authentication/patientAuth");
// Register route
router.post("/register", doctorController.register);

// Login route
router.post("/login", doctorController.login);

router.post("/auth-check", doctorController.authMiddleware);

router.post(
  "/compelete-appointment",
  auth,
  doctorController.addCompletedAppointment
);

router.post(
    "/review-report",
    auth,
    doctorController.reviewReport
  );


module.exports = router;
