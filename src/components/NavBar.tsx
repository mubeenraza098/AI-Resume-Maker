import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Menu, X, Mail, Shield, Users } from 'lucide-react';

interface NavBarProps {
  onNavigate?: (page: 'contact' | 'privacy' | 'about' | 'home') => void;
}

export const NavBar: React.FC<NavBarProps> = ({ onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (page: 'contact' | 'privacy' | 'about' | 'home') => {
    onNavigate?.(page);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { key: 'contact' as const, label: 'Contact Us', icon: Mail },
    { key: 'privacy' as const, label: 'Privacy Policy', icon: Shield },
    { key: 'about' as const, label: 'About Us', icon: Users },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => handleNavigation('home')}
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TalentScape AI
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  variant="ghost"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors"
                  onClick={() => handleNavigation(item.key)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={toggleMobileMenu}
            />
            <Card className="absolute right-4 top-20 w-72 shadow-xl border-0 bg-white/95 backdrop-blur-sm z-50">
              <div className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.key}
                      variant="ghost"
                      className="w-full justify-start flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-primary hover:bg-primary/5 transition-all"
                      onClick={() => handleNavigation(item.key)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </nav>
  );
};