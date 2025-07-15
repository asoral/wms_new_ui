
import { ReactNode } from 'react';
import WMSNavigation from './WMSNavigation';
import TopBar from './TopBar';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <WMSNavigation />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar />
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-full overflow-x-hidden px-3 md:px-6 pb-20 md:pb-6">
            {children}
          </div>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
};

export default Layout;
