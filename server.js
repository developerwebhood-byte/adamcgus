require("dotenv").config();
console.log("GOOGLE EMAIL:", process.env.GOOGLE_CLIENT_EMAIL);
console.log("KEY PREVIEW:", process.env.GOOGLE_PRIVATE_KEY?.slice(0, 40));

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const { Resend } = require("resend");
const { google } = require("googleapis");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ===============================
// RESEND SETUP
// ===============================

const resend = new Resend(process.env.RESEND_API_KEY);

// ===============================
// GOOGLE SHEETS SETUP
// ===============================

const auth = new google.auth.JWT({
email: process.env.GOOGLE_CLIENT_EMAIL,
key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});


let sheets;


async function initGoogleSheets() {
await auth.authorize();
sheets = google.sheets({ version: "v4", auth });
console.log("Google Sheets Connected ✅");
}


initGoogleSheets();

// ===============================
// SUBMIT LEAD API
// ===============================

app.post("/submitlead", async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Requried feilds are Name, Email and Phone Number",
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
        <h2>New Lead Details</h2>

        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    // ===============================
    // EMAIL TO USER
    // ===============================

    await resend.emails.send({
      from: "Adam CG <support@adamcg.uk>",
      to: [email],
      subject: "We Received Your Message",
      html: `
        <p>Hi ${fullName},</p>

        <p>Thank you for contacting Adam CG.</p>

        <p>Our team has received your message and will reach out to you shortly.</p>

        <p>Best Regards,<br/>
        Adam CG Team</p>
      `,
    });

    // ===============================
    // SAVE TO GOOGLE SHEET
    // ===============================

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Sheet1!A:F",
      valueInputOption: "USER_ENTERED",

      requestBody: {
        values: [
          [
            fullName,
            email,
            phone,
            subject,
            message,
            new Date().toLocaleString(),
          ],
        ],
      },
    });

    // ===============================
    // RESPONSE
    // ===============================

    res.json({
      success: true,
      message: "Lead submitted successfully",
    });

  } catch (error) {
    console.error("ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ===============================
// SERVER START
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
