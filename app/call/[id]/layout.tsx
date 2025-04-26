import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Call Session",
  description: "Live call session with AI assistance",
};

export default function CallLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen w-full overflow-hidden">
      {children}
    </div>
  );
} 