
import React from 'react';
import { Link } from 'react-router-dom';

type LogoProps = {
  size?: 'small' | 'medium' | 'large';
  color?: 'light' | 'dark';
  onClick?: () => void;
  className?: string;
};

export function Logo({ 
  size = 'medium', 
  color = 'dark', 
  onClick,
  className = '' 
}: LogoProps) {
  const sizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl',
  };
  
  const colorClasses = {
    light: 'text-white',
    dark: 'text-primary',
  };

  return (
    <Link 
      to="/" 
      className={`font-bold ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      onClick={onClick}
    >
      Welcome.Chat
    </Link>
  );
}

export default Logo;
