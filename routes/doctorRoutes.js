const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const auth = require("../authentication/patientAuth");

// Register route
router.post("/register", doctorController.register);

router.post("/change-password", auth, doctorController.changePassword);
// Login route
router.post("/login", doctorController.login);

router.post("/auth-check", doctorController.authMiddleware);

router.post("/review-report", auth, doctorController.reviewReport);
router.post("/giveDiagnosis", auth, doctorController.giveDiagnosis);

router.post(
  "/certificate-upload",
  auth,
  doctorController.uploadMiddleware,
  doctorController.certificateUpload
);

router.post(
  "/profile-image-upload",
  auth,
  doctorController.uploadMiddleware,
  doctorController.profileImageUpload
);
module.exports = router;
