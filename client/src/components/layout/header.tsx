import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, Bolt, User, LogOut, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleResetFeed = async () => {
    try {
      const response = await fetch('/api/reset-data', { method: 'POST' });
      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Reset failed');
      }
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="p-2 hover:bg-gray-100 transition-colors duration-200"
            >
              <Menu className="text-gray-600" size={20} />
            </Button>
            
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-800 rounded-full flex items-center justify-center">
                <Bolt className="text-white" size={16} />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900">CivicSaathi</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* User Profile */}
            {user && (
              <div className="hidden sm:flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <User className="text-white" size={16} />
                </div>
                <span className="text-sm font-medium text-gray-700 truncate max-w-[8rem]">
                  {user.username}
                </span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {user.credibilityScore}
                </Badge>
              </div>
            )}

            {/* Reset Feed */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFeed}
              className="p-2 hover:bg-gray-100 transition-colors duration-200"
              title="Reset feed to original 3 sample posts"
            >
              <RotateCcw className="text-gray-600" size={16} />
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 transition-colors duration-200"
            >
              <LogOut className="text-gray-600" size={16} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
