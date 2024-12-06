const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
// const auth = require("../authentication/patientAuth");

router.post("/get-log",  paymentController.getLog);
router.post("/create-checkout-session", paymentController.createCheckoutSession);

module.exports = router;