export const metadata = {
  title: "Day 5 Production App",
  description: "Production-style deployment with Next.js, Docker, NGINX, and HTTPS"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}