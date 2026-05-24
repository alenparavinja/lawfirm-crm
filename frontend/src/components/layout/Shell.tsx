import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useToast } from '@/hooks/use-toast';

export default function Shell() {
  const { toast } = useToast();

  useEffect(() => {
    function handleExpiry() {
      toast({
        title: 'Session expired',
        description: 'You have been signed out. Please sign in again.',
        variant: 'destructive',
      });
    }
    window.addEventListener('session:expired', handleExpiry);
    return () => window.removeEventListener('session:expired', handleExpiry);
  }, [toast]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onSignOut={() =>
          toast({ title: 'Signed out', description: 'You have been signed out successfully.' })
        } />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}