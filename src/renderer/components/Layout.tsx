import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun } from 'lucide-react';

const Layout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-900 dark:text-white">My Electron App</span>
              </Link>
            </div>
            <div className="flex items-center">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-gray-800 dark:text-yellow-200" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-800 dark:text-gray-200" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 text-gray-900 dark:text-white">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
