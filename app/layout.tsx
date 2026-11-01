import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muse-Q — E-Queue Tickets",
  description: "Virtual take-a-number queue system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto min-h-screen max-w-2xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
