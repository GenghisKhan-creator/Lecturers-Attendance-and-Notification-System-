import nodemailer from "nodemailer";
import pkg from "pg";
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

// ✅ Create DB client
const db = new Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
  ssl: { rejectUnauthorized: false }
});

db.connect()
  .then(() => console.log("✅ EmailUtil DB connected successfully"))
  .catch((err) => {
    console.error("❌ EmailUtil DB connection failed:", err.message);
    process.exit(1);
  });

// ✅ Setup email transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

// ✅ Exported function to send email
export async function sendEmail(userId, message) {
  const { rows } = await db.query("SELECT email FROM users WHERE id = $1", [userId]);
  const email = rows[0]?.email;

  if (!email) {
    console.warn(`No email found for user ${userId}`);
    return;
  }

  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: email,
    subject: "Lecture Notification",
    text: message,
  };

  return transporter.sendMail(mailOptions);
}
