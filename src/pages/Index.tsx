
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to app
        navigate('/app/home');
      } else {
        // User is not authenticated, redirect to landing page
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  return null; // This component doesn't render anything
};

export default Index;
