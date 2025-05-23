// app/api/checkout_sessions/route.js
//import 'server-only';
import { NextResponse } from 'next/server'
import { stripe } from '../../lib/stripe'

export async function POST(request) {
  try {
    const { priceId } = await request.json()
    
    const session = await stripe.checkout.sessions.create({

 currency: 'sgd',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',   //payment is not used
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/billing`, 
    })
   console.log('Generated URL:', session.url) // Add before return

    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode || 500 }
    )
  }
}