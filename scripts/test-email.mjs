import { config } from "dotenv";
import { Resend } from "resend";

config({ path: ".env.local" });

const key = process.env.RESEND_API_KEY;
console.log("Key present:", !!key);
console.log("Key starts with re_:", key?.startsWith("re_"));

const resend = new Resend(key);

try {
  const result = await resend.emails.send({
    from: "Project Tracker <onboarding@resend.dev>",
    to: "omarschalik@gmail.com",
    subject: "Test invite from Project Tracker",
    html: "<p>This is a test email. If you see this, Resend is working.</p>",
  });
  console.log("Result:", JSON.stringify(result, null, 2));
} catch (err) {
  console.error("Error:", err.message);
}
