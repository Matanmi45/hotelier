import nodemailer from "nodemailer";

// --------------------
// 1. Options Interface
// --------------------
interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

// --------------------
// 2. Function
// --------------------
export const sendEmail = async (
  options: EmailOptions
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST as string,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER as string,
      pass: process.env.SMTP_PASSWORD as string
    }
  });

  // Email config
  const emailOptions = {
    from: "Book My Stay Support <support@bookmystay.com>",
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  await transporter.sendMail(emailOptions);
};