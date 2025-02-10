const express = require("express");
// const bodyParser = require("body-parser");
const router = express.Router();
const auth = require("../authentication/patientAuth");
const paymentController = require("../controllers/paymentController");

router.post("/get-log",  paymentController.getLog);
router.post("/create-checkout-session", auth, paymentController.createCheckoutSession);
// router.post("/webhook", bodyParser.raw({ type: "application/json" }), paymentController.handleStripeWebhook);
// router.post("/webhook", express.json({ type: "application/json" }), paymentController.handleStripeWebhook);

module.exports = router;