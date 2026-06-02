import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind class merger
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format date
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format duration
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

// Truncate text
export function truncate(text, length = 100) {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Get status color
export function getStatusColor(status) {
  const colors = {
    completed: 'text-green-500',
    running: 'text-blue-500',
    failed: 'text-red-500',
    pending: 'text-yellow-500',
    cancelled: 'text-gray-500'
  }
  return colors[status] || 'text-gray-500'
}