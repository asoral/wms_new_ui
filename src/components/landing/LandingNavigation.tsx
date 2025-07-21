
import { useState } from 'react';
import { Menu, X, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const LandingNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleStartNow = () => {
    navigate('/auth?tab=signup');
  };

  const handleLogin = () => {
    navigate('/auth?tab=login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground">WMS</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#screenshots" className="text-muted-foreground hover:text-foreground transition-colors">
              Screenshots
            </a>
            <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">
              Benefits
            </a>
            <Button variant="ghost" onClick={handleLogin}>
              Login
            </Button>
            <Button onClick={handleStartNow} className="bg-blue-600 hover:bg-blue-700">
              Start Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-4 py-6 space-y-4">
            <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#screenshots" className="block text-muted-foreground hover:text-foreground transition-colors">
              Screenshots
            </a>
            <a href="#benefits" className="block text-muted-foreground hover:text-foreground transition-colors">
              Benefits
            </a>
            <div className="pt-4 space-y-3">
              <Button variant="outline" onClick={handleLogin} className="w-full">
                Login
              </Button>
              <Button onClick={handleStartNow} className="w-full bg-blue-600 hover:bg-blue-700">
                Start Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavigation;
