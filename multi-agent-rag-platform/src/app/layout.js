import './globals.css'

export const metadata = {
  title: 'Multi-Agent RAG Platform',
  description: 'Multi-agent AI research team powered by local LLMs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}