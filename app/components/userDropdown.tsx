// app/components/UserDropdown.tsx
"use client";

import React from "react";

interface UserDropdownProps {
  username: string;
  isOpen: boolean;
  onToggle: () => void;
  onSignOut: () => void;
  onViewRideHistory: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  username,
  isOpen,
  onToggle,
  onSignOut,
  onViewRideHistory,
}) => {
  return (
    <div className="relative flex flex-col items-end z-50">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 p-2 rounded-lg text-white hover:bg-gray-800 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {username || "User"}
        <i
          className={`ri-arrow-${isOpen ? "up" : "down"}-s-line transition-transform`}
        ></i>
      </button>

      {/* Dropdown Panel */}
      <div
        className={`absolute top-full right-0 overflow-hidden transition-all duration-300 ease-in-out bg-white rounded-lg shadow-lg w-48 mt-2 z-50 ${
          isOpen
            ? "max-h-[400px] opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex flex-col p-2 text-gray-800">
          <button
            className="text-left p-2 cursor-pointer hover:bg-gray-100 rounded flex items-center"
            onClick={() => {
              onToggle();
            }}
          >
            <i className="ri-user-line mr-2"></i>
            My Account
          </button>

          <button
            className="text-left p-2 cursor-pointer hover:bg-gray-100 rounded flex items-center"
            onClick={() => {
              onToggle();
              if (typeof onViewRideHistory === "function") onViewRideHistory();
            }}
          >
            <i className="ri-history-line mr-2"></i>
            Ride History
          </button>

          <button
            className="text-left p-2 cursor-pointer hover:bg-gray-100 rounded flex items-center"
            onClick={() => {
              onToggle();
            }}
          >
            <i className="ri-wallet-line mr-2"></i>
            Wallet
          </button>

          <div className="border-t border-gray-200 my-2"></div>

          <button
            className="text-left p-2 cursor-pointer hover:bg-gray-100 rounded flex items-center text-red-600"
            onClick={onSignOut}
          >
            <i className="ri-logout-box-line mr-2"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};