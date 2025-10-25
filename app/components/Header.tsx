// app/components/Header.tsx
import React from 'react';
import { signOut } from 'next-auth/react';
import { UserDropdown } from './userDropdown';

interface HeaderProps {
  session: any;
  status: string;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  onViewRideHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  session, 
  status, 
  dropdownOpen, 
  setDropdownOpen,
  onViewRideHistory 
}) => {
  const handleViewRideHistory = () => {
    console.log('Header: onViewRideHistory called', typeof onViewRideHistory);
    if (onViewRideHistory) {
      onViewRideHistory();
    } else {
      console.error('onViewRideHistory is not defined');
    }
  };

  return (
    <div className="h-16 rounded-b-sm w-full bg-black flex items-center justify-between px-6">
      <div className="flex items-center text-white text-[1.125rem] gap-10">
        <p className="font-bold text-[1.75rem]">Ryda</p>
        <i className="text-3xl ri-taxi-line" aria-hidden="true"></i>
        <p>Ride</p>
        <p>Drive</p>
        <p>Business</p>
        <p>About</p>
      </div>

      <div className="flex absolute left-3/4 items-center text-white text-[1.125rem] gap-10">
        <p>En</p>
        <p>Help</p>

        {status === 'loading' ? (
          <p>Loading...</p>
        ) : session ? (
          <UserDropdown 
            username={session.user?.name || session.user?.email || ''}
            isOpen={dropdownOpen}
            onToggle={() => setDropdownOpen(!dropdownOpen)}
            onSignOut={() => signOut()}
            onViewRideHistory={handleViewRideHistory}
          />
        ) : (
          <>
            <p>Login</p>
            <button className="h-7 w-20 bg-white rounded-3xl text-black">Signup</button>
          </>
        )}
      </div>
    </div>
  );
};