// app/api/sendEmail/route.js
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request) {
  // Check for API key
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Resend API key not configured" },
      { status: 500 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'contact@obserpedia.com',
      to: process.env.TO_EMAIL,
      subject: `New Contact Form Submission from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}