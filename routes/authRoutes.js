const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/", authController.home);
router.get("/auth/google", authController.googleLogin);
router.get("/auth/callback", authController.googleCallback, (req, res) => {
  res.redirect("/profile");
});
router.get("/profile", authController.profile);
router.get("/logout", authController.logout);

router.post("/forget-password", authController.forgetPassword);

router.post("/change-password", authController.changePassword);

module.exports = router;
