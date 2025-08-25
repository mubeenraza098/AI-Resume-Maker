import React from 'react';
import { NavBar } from './NavBar';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const handleNavigation = (page: 'contact' | 'privacy' | 'about' | 'home') => {
    switch (page) {
      case 'contact':
        navigate('/contact');
        break;
      case 'privacy':
        navigate('/privacy');
        break;
      case 'about':
        navigate('/about');
        break;
      case 'home':
        navigate('/');
        break;
    }
  };

  return (
    <div className="min-h-screen">
      <NavBar onNavigate={handleNavigation} />
      <main>{children}</main>
    </div>
  );
};