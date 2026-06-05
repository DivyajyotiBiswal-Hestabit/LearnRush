'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useAuthActions } from '@/hooks/useAuth'
import { Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'

export default function Navbar() {
  const { user } = useAuth()
  const { logout } = useAuthActions()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U'
  const userEmail = user?.email || ''
  const userName = user?.user_metadata?.full_name || userEmail.split('@')[0]

  return (
    <header className="h-14 bg-surface border-b border-[#2e2e4e] px-6 flex items-center justify-between flex-shrink-0">

      {/* Left — page title (empty for now, pages will set their own) */}
      <div />

      {/* Right — actions */}
      <div className="flex items-center gap-3">

        {/* Notification bell */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[#a0a0b8] hover:text-white hover:bg-[#16213e] transition-colors">
          <Bell size={17} />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-[#16213e] transition-colors"
          >
            {/* Avatar */}
            <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userInitial}
            </div>
            <span className="text-sm text-white font-medium max-w-[120px] truncate">
              {userName}
            </span>
            <ChevronDown
              size={14}
              className={`text-[#a0a0b8] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-[#2e2e4e] rounded-xl shadow-xl z-50 overflow-hidden">

              {/* User info */}
              <div className="px-4 py-3 border-b border-[#2e2e4e]">
                <p className="text-white text-sm font-medium truncate">{userName}</p>
                <p className="text-[#a0a0b8] text-xs truncate mt-0.5">{userEmail}</p>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[#a0a0b8] hover:text-white hover:bg-[#16213e] transition-colors"
                >
                  <User size={15} />
                  Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[#a0a0b8] hover:text-white hover:bg-[#16213e] transition-colors"
                >
                  <Settings size={15} />
                  Settings
                </Link>
              </div>

              {/* Logout */}
              <div className="py-1.5 border-t border-[#2e2e4e]">
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    logout()
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-[#16213e] transition-colors w-full text-left"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  )
}