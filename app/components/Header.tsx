"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { UserDropdown } from "./userDropdown"
import { Menu, X } from "lucide-react"

interface HeaderProps {
  session: any
  status: string
  dropdownOpen: boolean
  setDropdownOpen: (open: boolean) => void
  onViewRideHistory?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  session,
  status,
  dropdownOpen,
  setDropdownOpen,
  onViewRideHistory,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleViewRideHistory = () => {
    console.log("Header: onViewRideHistory called", typeof onViewRideHistory)
    if (onViewRideHistory) {
      onViewRideHistory()
    } else {
      console.error("onViewRideHistory is not defined")
    }
  }

  const navItems = [
    { label: "Ride", href: "#" },
    { label: "Drive", href: "#" },
    { label: "Business", href: "#" },
    { label: "About", href: "#" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/50 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg group-hover:shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300">
              <i className="text-lg md:text-xl text-white ri-taxi-line" aria-hidden="true"></i>
            </div>
            <span className="hidden sm:inline font-bold text-xl md:text-2xl bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Ryda
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 lg:gap-12">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm lg:text-base font-medium text-slate-300 hover:text-emerald-400 transition-colors duration-200 relative group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-300 group-hover:w-full transition-all duration-300"></span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 md:gap-8">
          {/* Language and Help - Hidden on smaller screens */}
          <div className="hidden lg:flex items-center gap-6">
            <button className="text-sm text-slate-300 hover:text-emerald-400 transition-colors duration-200">En</button>
            <button className="text-sm text-slate-300 hover:text-emerald-400 transition-colors duration-200">
              Help
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {status === "loading" ? (
              <span className="text-sm text-slate-400">Loading...</span>
            ) : session ? (
              <UserDropdown
                username={session.user?.name || session.user?.email || ""}
                isOpen={dropdownOpen}
                onToggle={() => setDropdownOpen(!dropdownOpen)}
                onSignOut={() => signOut()}
                onViewRideHistory={handleViewRideHistory}
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-block text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link href="/register">
                  <button className="px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-emerald-500/30 hover:from-emerald-400 hover:to-emerald-500 transition-all duration-300 transform hover:scale-105">
                    Sign up
                  </button>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-300" /> : <Menu className="w-5 h-5 text-slate-300" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-slate-800/50 bg-slate-900/95 backdrop-blur-sm">
          <div className="flex flex-col px-4 py-3 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-800/50 mt-2 pt-2">
              <button className="w-full px-3 py-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors duration-200 text-left">
                En
              </button>
              <button className="w-full px-3 py-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors duration-200 text-left">
                Help
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
