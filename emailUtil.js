import nodemailer from "nodemailer";
import pg from "pg";
import dotenv from 'dotenv'

dotenv.config();

const db = new pg.Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

db.connect();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

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

