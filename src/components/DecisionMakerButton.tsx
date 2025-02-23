import { useEffect, useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';

interface DecisionMakerButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export function DecisionMakerButton({ children, ...props }: DecisionMakerButtonProps) {
  const [isDecisionMaker, setIsDecisionMaker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const response = await fetch('/api/admin/users/role');
        if (response.ok) {
          const data = await response.json();
          setIsDecisionMaker(data.role === 'decision_maker');
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
    
    // Check permissions periodically (every 30 seconds)
    const interval = setInterval(checkPermissions, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return null;
  }

  if (!isDecisionMaker) {
    return null;
  }

  return <Button {...props}>{children}</Button>;
}