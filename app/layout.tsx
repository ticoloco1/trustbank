import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata = {
  title: "TrustBank",
  description: "TrustBank",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
