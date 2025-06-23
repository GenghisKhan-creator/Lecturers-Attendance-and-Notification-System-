import nodemailer from "nodemailer";
import pkg from "pg";
import connectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv'
import session from "express-session";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
  ssl: { rejectUnauthorized: false }
});

// ✅ Setup session store
const pgSession = connectPgSimple(session);

app.use(
  session({
    store: new pgSession({
      pool: pool, // ✅ use pool, not Client
    }),
    secret: process.env.SESSION_PASSWORD,
    resave: false,
    saveUninitialized: false
  })
);

const db = new pkg.Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
  ssl: { rejectUnauthorized: false }
});

db.connect()
  .then(() => console.log("✅ DB connected successfully"))
  .catch((err) => {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  });

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

