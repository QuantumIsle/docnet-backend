const { addUpcomingAppointment } = require("./appointmentController");

require("dotenv").config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// const stripe = require('stripe')(stripeSecretKey, {
//     apiVersion: '2024-11-20.acacia; custom_checkout_beta=v1;',
// });

const stripe = require("stripe")(stripeSecretKey, {
    apiVersion: "2024-11-20.acacia",
});

const getLog = async (req, res) => {
    res.json({ message: "hello" });
};
const createCheckoutSession = async (req, res) => {
    try {
        // const session = await stripe.checkout.sessions.create({
        //     line_items: [
        //         {
        //             price_data: {
        //                 currency: 'usd',
        //                 product_data: {
        //                     name: 'T-shirt',
        //                 },
        //                 unit_amount: 2000,
        //             },
        //             quantity: 1,
        //         },
        //     ],
        //     mode: 'payment',
        //     ui_mode: 'custom',
        //     // ui_mode: 'embedded',
        //     // The URL of your payment completion page
        //     return_url: 'http://localhost:5173/testing/success',
        //     // success_url: 'http://localhost:5173/testing/success',
        //     // cancel_url: 'http://localhost:5173/testing/cancel',
        // });

        const { requestData, currentUrl } = req.body; // Get current URL from the request body
        requestData.patientId = req.user;

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            // name: "Upcoming Appointment Booking",
                            name: `Upcoming Appointment: ${requestData.doctorName} - ${requestData.selectedDate} - ${requestData.selectedTime}`,
                            description: "Confirm your appointment booking.",
                        },
                        unit_amount: requestData.amount * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            // success_url: 'http://localhost:5173/testing/success',
            // cancel_url: 'http://localhost:5173/testing/cancel',
            success_url: `${currentUrl}?status=success`,
            cancel_url: `${currentUrl}?status=cancel`,
            metadata: {
                appointmentDetails: JSON.stringify(requestData),
            },
        });
        res.status(200).json({ url: session.url });
    } catch (err) {
        console.log(err);
        console.log(stripeSecretKey);
        res.status(500).send({ message: "Internal server error" });
    }
};

const handleStripeWebhook = async (req, res) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // res.json({ message: 'hello', endpointSecret });
    // console.log(endpointSecret);
    const sig = req.headers["stripe-signature"];

    // let event;

    try {
        const event = stripe.webhooks.constructEvent(
            req.body, // Raw body
            sig, // Signature from Stripe
            endpointSecret // Webhook secret
        );
        console.log("event created successfully");

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;

                const appointmentDetails = session.metadata.appointmentDetails;
                const paymentIntentId = session.payment_intent;

                if (session.payment_status === "paid") {
                    // Mark the payment as successful in your database
                    await addUpcomingAppointment(
                        paymentIntentId,
                        "success",
                        appointmentDetails
                    );
                    console.log(
                        "Payment successful. Appointment details saved."
                    );
                }
                break;
            }
            case "checkout.session.expired": {
                // const session = event.data.object;
                // Mark payment as failed/expired in your database
                // await savePaymentStatus(session.id, "failed");
                console.log("Payment failed or expired.");
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (err) {
        console.error("Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    res.json({ received: true });
};


const refundPayment= async (paymentId) => {
    try {
        const refund = await stripe.refunds.create({
            payment_intent: paymentId,
        });
        console.log("paymentId", paymentId);
        return { success: true, data: refund };
        // return { success: true, data: paymentId };
    } catch (error) {
        console.error("Error processing refund:", error);
        return { success: false, error };
    }
};

module.exports = {
    getLog,createCheckoutSession,handleStripeWebhook,refundPayment,
};
