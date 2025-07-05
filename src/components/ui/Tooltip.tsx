import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function Tooltip({ 
  content, 
  children, 
  placement = 'top',
  className = '' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let x = 0;
      let y = 0;

      switch (placement) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom;
          break;
        case 'left':
          x = rect.left;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right;
          y = rect.top + rect.height / 2;
          break;
      }

      setPosition({ x, y });
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const getTooltipStyles = () => {
    const baseStyles = cn(
      'fixed z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none',
      'transition-opacity duration-200 ease-in-out whitespace-nowrap max-w-xs',
      isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    );

    let positionStyles = '';
    switch (placement) {
      case 'top':
        positionStyles = '-translate-x-1/2 -translate-y-full -mt-2';
        break;
      case 'bottom':
        positionStyles = '-translate-x-1/2 mt-2';
        break;
      case 'left':
        positionStyles = '-translate-y-1/2 -translate-x-full -ml-2';
        break;
      case 'right':
        positionStyles = '-translate-y-1/2 ml-2';
        break;
    }

    return cn(baseStyles, positionStyles);
  };

  const getArrowStyles = () => {
    const baseArrowStyles = 'absolute w-2 h-2 bg-gray-900 transform rotate-45';
    
    switch (placement) {
      case 'top':
        return cn(baseArrowStyles, 'top-full left-1/2 -translate-x-1/2 -mt-1');
      case 'bottom':
        return cn(baseArrowStyles, 'bottom-full left-1/2 -translate-x-1/2 -mb-1');
      case 'left':
        return cn(baseArrowStyles, 'left-full top-1/2 -translate-y-1/2 -ml-1');
      case 'right':
        return cn(baseArrowStyles, 'right-full top-1/2 -translate-y-1/2 -mr-1');
      default:
        return baseArrowStyles;
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn('relative inline-block', className)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={getTooltipStyles()}
          style={{
            left: position.x,
            top: position.y,
          }}
          role="tooltip"
        >
          {content}
          <div className={getArrowStyles()} />
        </div>
      )}
    </>
  );
} 