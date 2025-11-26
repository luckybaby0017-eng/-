import React from 'react';

interface KeypadProps {
  onPress: (val: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const Keypad: React.FC<KeypadProps> = ({ onPress, onDelete, onSubmit, disabled }) => {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto p-2">
      {nums.map((num) => (
        <button
          key={num}
          onClick={() => onPress(num.toString())}
          disabled={disabled}
          className={`
            h-16 text-3xl font-bold rounded-2xl shadow-[0_4px_0_rgb(0,0,0,0.2)] 
            active:shadow-none active:translate-y-1 transition-all
            ${num === 0 ? 'col-span-1' : ''}
            bg-white text-gray-700 hover:bg-gray-50
          `}
        >
          {num}
        </button>
      ))}
      
      <button
        onClick={onDelete}
        disabled={disabled}
        className="h-16 text-xl font-bold rounded-2xl shadow-[0_4px_0_rgb(0,0,0,0.2)] 
        active:shadow-none active:translate-y-1 transition-all
        bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
      >
        DEL
      </button>

      <button
        onClick={onSubmit}
        disabled={disabled}
        className="h-16 text-xl font-bold rounded-2xl shadow-[0_4px_0_rgb(0,0,0,0.2)] 
        active:shadow-none active:translate-y-1 transition-all
        bg-green-400 text-white hover:bg-green-500 flex items-center justify-center"
      >
        GO!
      </button>
    </div>
  );
};

export default Keypad;