require("dotenv").config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

// const stripe = require('stripe')(stripeSecretKey, {
//     apiVersion: '2024-11-20.acacia; custom_checkout_beta=v1;',
// });

const stripe = require('stripe')(stripeSecretKey, {
    // apiVersion: '2024-11-20.acacia; custom_checkout_beta=v1;',
    apiVersion: '2024-11-20.acacia',
});



const getLog = async (req, res) => {
    res.json({ message: 'hello' })
}
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

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'T-shirt',
                        },
                        unit_amount: 2000,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:5173/testing/success',
            cancel_url: 'http://localhost:5173/testing/cancel',
        });

        // res.status(200).json({ clientSecret: session.client_secret });
        res.status(200).json({ url: session.url });

        // const session = await stripe.checkout.sessions.create({
        //     line_items: [
        //       {
        //         price_data: {
        //           currency: 'usd',
        //           product_data: {
        //             name: 'T-shirt',
        //           },
        //           unit_amount: 2000,
        //         },
        //         quantity: 1,
        //       },
        //     ],
        //     mode: 'payment',
        //     ui_mode: 'embedded',
        //     // The URL of your payment completion page
        //     return_url: 'http://localhost:5173/testing/success',
        //   });
        
        // //   res.json({clientSecret: session.client_secret});
        //   res.json({url: session.url});


    } catch (err) {
        console.log(err);
        console.log(stripeSecretKey);
        res.status(500).send({ message: 'Internal server error' });
    }
}


module.exports = {
    getLog,
    createCheckoutSession
}