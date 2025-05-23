// 1. Install stripe in your project
// npm install stripe

// 2. Create this API route in /pages/api/create-checkout-session.ts or .js

import Stripe from 'stripe';
import { NextApiRequest, NextApiResponse } from 'next';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'grabpay', 'paynow'], // customize as needed
      line_items: [
        {
          price_data: {
            currency: 'sgd',
            product_data: {
              name: 'Premium AI Access',
            },
            unit_amount: 1990, // SGD $19.90 (in cents)
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
