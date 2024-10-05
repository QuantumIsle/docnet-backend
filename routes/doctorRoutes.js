const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");

// Register route
router.post("/register", doctorController.register);

// Login route
router.post("/login", doctorController.login);

router.post("/auth-check", doctorController.authMiddleware);

router.post("/compelete-appointment",doctorController.addCompletedAppointment);
module.exports = router;
