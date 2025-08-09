import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <div className="flex justify-between items-center w-full">
      {/* Logo and Title */}
      <div className="flex items-center space-x-2">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 hidden sm:block">
            AI Resume Management
          </span>
        </Link>
      </div>

      {/* Account Holder Name - moved to the right */}
      <div className="flex items-center space-x-2">
        <User className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {user ? user.name : 'Guest'}
        </span>
      </div>
    </div>
  );
};

export default Navbar; 