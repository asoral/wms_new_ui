
import { useState, useEffect } from 'react';
import { Truck, Warehouse, Package, Ship } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner = ({ size = 24, className = "" }: LoadingSpinnerProps) => {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  
  const icons = [Truck, Warehouse, Package, Ship];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % icons.length);
    }, 500); // Change icon every 500ms
    
    return () => clearInterval(interval);
  }, []);
  
  const CurrentIcon = icons[currentIconIndex];
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <CurrentIcon 
        size={size} 
        className="animate-pulse text-blue-600" 
      />
    </div>
  );
};

export default LoadingSpinner;
