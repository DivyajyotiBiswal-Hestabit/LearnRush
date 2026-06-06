import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FlowAgent — Multi-Agent Automation Platform',
  description: 'Automate customer inquiries with AI agents',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#b2cea4ff',
                color: '#fff',
                border: '1px solid #2e2e3e',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}