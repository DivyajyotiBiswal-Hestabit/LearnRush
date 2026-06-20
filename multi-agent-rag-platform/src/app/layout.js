import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: { default: 'MultiAgent RAG', template: '%s | MultiAgent RAG' },
  description: 'Multi-agent AI research platform powered by local LLMs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ background: '#111318' }}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: '#111318' }}>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={3000}
          theme="dark"
        />
      </body>
    </html>
  )
}