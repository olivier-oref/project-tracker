import type { Metadata, Viewport } from "next";
import { FeedbackProvider } from "@fasterfixes/react";
import "./globals.css";

// Faster Fixes feedback widget (public project id). It mounts only for reviewers who opened the
// site with ?ff_token=…; everyone else gets an inert provider and no requests to Faster Fixes.
const FF_PROJECT_ID = "proj_80a273e6ef05133c46ad7c92";

export const metadata: Metadata = {
  title: "Project Tracker",
  description: "Collaborative project tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16233F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans bg-paper text-ink min-h-screen antialiased">
        <FeedbackProvider projectId={FF_PROJECT_ID}>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
