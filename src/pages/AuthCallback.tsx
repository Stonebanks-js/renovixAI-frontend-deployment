import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Authentication failed",
            description: error.message,
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        if (data?.session?.user) {
          // Check if profile exists, if not it will be created by the trigger
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.session.user.id)
            .maybeSingle();

          toast({
            title: "Welcome!",
            description: `You have successfully signed in${data.session.user.user_metadata?.full_name ? `, ${data.session.user.user_metadata.full_name}` : ''}!`,
          });
          
          navigate('/');
        } else {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred during authentication.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;