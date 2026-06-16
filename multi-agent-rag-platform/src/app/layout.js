import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: {
    default: 'MultiAgent RAG Platform',
    template: '%s | MultiAgent RAG',
  },
  description: 'Multi-agent AI research platform powered by local LLMs',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster position="bottom-right" richColors closeButton duration={3000} />
      </body>
    </html>
  )
}