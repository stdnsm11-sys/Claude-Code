import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryForge Studio",
  description: "Generate fully illustrated, character-consistent storybooks from a single prompt.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b bg-card/70 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <BookOpenText className="h-5 w-5 text-primary" />
              <span className="font-serif text-lg">StoryForge Studio</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
