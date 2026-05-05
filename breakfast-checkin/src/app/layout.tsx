import type { Metadata } from "next";
import "./globals.css";
import ReminderOverlay from "@/frontend/components/ReminderOverlay";

export const metadata: Metadata = {
  title: "Breakfast Check-In",
  description: "Hotel breakfast check-in management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f5f5f0] text-[#2d2d2d] antialiased">
        {children}
        <ReminderOverlay />
      </body>
    </html>
  );
}
