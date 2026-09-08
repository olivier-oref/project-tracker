import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function sendInviteEmail({
  to,
  inviterName,
  projectTitle,
  projectUrl,
}: {
  to: string;
  inviterName: string;
  projectTitle: string;
  projectUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: "Project Tracker <onboarding@resend.dev>",
    to,
    subject: `You've been invited to "${projectTitle}"`,
    html: `
      <div style="background:#FAF6EC;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5DFC8;">
          <div style="background:#1B2A4A;padding:20px 28px;">
            <span style="color:#ffffff;font-size:16px;font-weight:600;">Project Tracker</span>
          </div>
          <div style="padding:28px;">
            <h1 style="font-size:20px;color:#1B2A4A;margin:0 0 12px;">You've been invited to "${projectTitle}"</h1>
            <p style="font-size:15px;color:#4A4A4A;line-height:1.5;margin:0 0 24px;">
              ${inviterName} invited you to collaborate on this project.
            </p>
            <a href="${projectUrl}" style="display:inline-block;background:#1B2A4A;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
              View Project
            </a>
          </div>
        </div>
      </div>
    `,
  });
}
