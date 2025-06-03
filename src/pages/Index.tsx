
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { Loader2, Warehouse } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // If user is authenticated, redirect to home
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
          </div>
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt for unauthenticated users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <Warehouse className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-gray-900">WMS</h1>
        <p className="text-xl text-gray-600 mb-8">Warehouse Management System</p>
        <p className="text-gray-500 mb-6">Please sign in to access your warehouse dashboard</p>
        <a 
          href="/auth" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Sign In
        </a>
      </div>
    </div>
  );
};

export default Index;
