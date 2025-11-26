import React from 'react';
import { Triceratops } from './DinoIcons';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = Math.min(100, (current / total) * 100);

  return (
    <div className="w-full max-w-md mt-4 mb-8">
      <div className="relative w-full h-4 bg-dino-brown/30 rounded-full shadow-inner">
        {/* Progress Fill */}
        <div
          className="absolute top-0 left-0 h-4 bg-dino-green rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Moving Dino */}
        <div 
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-10"
            style={{ left: `calc(${percentage}% - 15px)` }}
        >
            <div className="w-8 h-8 bg-white border-2 border-dino-green rounded-full flex items-center justify-center shadow-sm animate-waddle">
                <Triceratops className="w-5 h-5 text-dino-dark-green" />
            </div>
        </div>

        {/* Text */}
        <div className="absolute top-5 right-0 text-xs font-bold text-dino-brown">
             {current} / {total}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;