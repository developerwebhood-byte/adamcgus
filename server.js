require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(bodyParser.json());

// ===============================
// RESEND SETUP
// ===============================

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY in environment variables");
}

const resend = new Resend(process.env.RESEND_API_KEY);

// ===============================
// HEALTH CHECK (OPTIONAL)
// ===============================

app.get("/", (req, res) => {
  res.send("Adam CG Lead API is running ✅");
});

// ===============================
// SUBMIT LEAD API
// ===============================

app.post("/submitlead", async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (!fullName || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ===============================
    // EMAIL TO OWNER
    // ===============================

    await resend.emails.send({
      from: "Adam CG <no-reply@adamcg.uk>",
      to: ["adam@adamcg.uk"],
      subject: "🚀 New Lead Received",
      html: `
        <h2>New Lead Received</h2>

        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br/>${message}</p>

        <hr/>
        <p>Sent from Adam CG Website</p>
      `,
    });

    // ===============================
    // EMAIL TO USER
    // ===============================

    await resend.emails.send({
      from: "Adam CG <support@adamcg.uk>",
      to: [email],
      subject: "We Have Received Your Message",
      html: `
        <p>Hi ${fullName},</p>

        <p>Thank you for contacting Adam CG.</p>

        <p>We have received your message and our team will get back to you shortly.</p>

        <br/>

        <p><strong>Your Message:</strong></p>
        <p>${message}</p>

        <br/>

        <p>Best Regards,<br/>
        Adam CG Team</p>
      `,
    });

    // ===============================
    // SUCCESS RESPONSE
    // ===============================

    res.json({
      success: true,
      message: "Lead submitted successfully. Emails sent.",
    });

  } catch (error) {
    console.error("EMAIL ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong while sending emails",
    });
  }
});

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
