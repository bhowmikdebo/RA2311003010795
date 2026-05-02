import type { Metadata } from "next";
import { Providers } from "@/src/components/Providers";

export const metadata: Metadata = {
  title: "Campus Notifications",
  description: "Priority inbox for campus notifications"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
