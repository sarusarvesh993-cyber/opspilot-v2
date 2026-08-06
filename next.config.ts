import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  ...(process.env.VERCEL_ENV === "production"
    ? [{ key: "X-Frame-Options", value: "DENY" }]
    : []),
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Vercel's adapter requires the native .next trace layout. Docker builds run
  // outside Vercel and still receive the minimal standalone server bundle.
  ...(process.env.VERCEL === "1" ? {} : { output: "standalone" as const }),
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
