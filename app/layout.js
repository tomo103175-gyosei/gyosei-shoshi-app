import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "行政書士試験勉強",
  description: "Geminiを活用した行政書士試験対策アプリ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={notoSansJP.variable}>
        {children}
      </body>
    </html>
  );
}
