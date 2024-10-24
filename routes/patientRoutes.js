const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const auth = require("../authentication/patientAuth");
// Register route
router.post("/register", patientController.register);

// Login route
router.post("/login", patientController.login);

router.post("/change-password", auth, patientController.changePassword);
router.post("/auth-check", patientController.authMiddleware);

router.post(
  "/report-upload",
  auth,
  patientController.uploadMiddleware,
  patientController.reportUpload
);

router.post("/addReview", auth, patientController.addReview);

module.exports = router;
