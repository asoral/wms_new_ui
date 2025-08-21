
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName?: string, erpnextConfig?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  updateActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Session timeout: 24 hours of inactivity (much more reasonable)
  const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Update activity timestamp with throttling
  const updateActivity = useCallback(() => {
    const now = Date.now();
    // Only update if at least 1 second has passed since last update
    if (now - lastActivityRef.current > 1000) {
      lastActivityRef.current = now;
    }
  }, []);

  // Check for session timeout
  const checkSessionTimeout = useCallback(async () => {
    if (!user || !session) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    if (timeSinceLastActivity > SESSION_TIMEOUT) {
      console.log('Session timed out due to inactivity');
      await supabase.auth.signOut();
      return;
    }
    
    // Schedule next check
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const nextCheckIn = SESSION_TIMEOUT - timeSinceLastActivity;
    timeoutRef.current = setTimeout(checkSessionTimeout, Math.min(nextCheckIn, 60000)); // Check at least every minute
  }, [user, session, SESSION_TIMEOUT]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start session timeout checking
    checkSessionTimeout();

    return () => {
      // Remove event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [user, updateActivity, checkSessionTimeout]);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST to catch any auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          console.log('Auth state change:', event, !!session);
          setSession(session);
          setUser(session?.user ?? null);
          if (!session && event === 'SIGNED_OUT') {
            // Clear any existing timeouts on sign out
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          }
        }
      }
    );
    
    // THEN get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
        }
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, erpnextConfig?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const userData: any = {
      full_name: fullName || ''
    };

    if (erpnextConfig) {
      userData.erpnext_url = erpnextConfig.erpnext_url;
      userData.erpnext_api_key = erpnextConfig.erpnext_api_key;
      userData.erpnext_api_secret = erpnextConfig.erpnext_api_secret;
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    updateActivity
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
