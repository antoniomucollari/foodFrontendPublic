import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <Button
      variant="link"
      size="icon"
      onClick={toggleTheme}
      className={`relative ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <Sun className={`h-4 w-4 transition-all ${isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
      <Moon className={`absolute h-4 w-4 transition-all ${isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
    </Button>
  );
};

export default ThemeToggle;

