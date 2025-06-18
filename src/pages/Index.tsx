
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WMSNavigation from '@/components/WMSNavigation';
import TopBar from '@/components/TopBar';
import BottomNavigation from '@/components/BottomNavigation';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home page since this is the main entry point
    navigate('/home');
  }, [navigate]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <WMSNavigation />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar />
        
        {/* Content */}
        <div className="flex-1 container mx-auto py-6 px-4 md:px-6 space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to WMS</h1>
            <p className="text-xl text-gray-600">Warehouse Management System</p>
          </div>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
};

export default Index;
