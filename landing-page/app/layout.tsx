import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "HR-AI | Intelligent Recruitment Platform - AI-Powered Hiring Solutions",
  description:
    "Transform your hiring process with AI-powered resume analysis, smart candidate matching, and automated recruitment workflows. Reduce time-to-hire by 70% with HR-AI.",
  keywords: [
    "HR AI",
    "recruitment software",
    "AI hiring",
    "candidate matching",
    "resume analysis",
    "talent acquisition",
    "hiring automation",
    "ATS",
    "applicant tracking system",
    "AI recruitment",
    "HR technology",
    "recruitment platform",
  ],
  authors: [{ name: "HR-AI Team" }],
  creator: "HR-AI",
  publisher: "HR-AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:8080"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "HR-AI | Intelligent Recruitment Platform",
    description:
      "Transform your hiring process with AI-powered recruitment tools. Reduce time-to-hire by 70%.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:8080",
    siteName: "HR-AI",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "HR-AI - Intelligent Recruitment Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HR-AI | Intelligent Recruitment Platform",
    description: "Transform your hiring process with AI-powered recruitment tools.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "HR-AI",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "127",
              },
              description:
                "AI-powered recruitment platform that automates resume analysis, candidate matching, and hiring workflows.",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "HR-AI",
              url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:8080",
              logo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:8080"}/logo.png`,
              description: "Intelligent recruitment platform powered by AI",
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        {/* Analytics scripts can be added here */}
      </body>
    </html>
  );
}
