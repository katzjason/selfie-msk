interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  leftLabel: string;
  rightLabel: string;
  className?: string;
}

export default function ToggleSwitch({ 
  checked, 
  onChange, 
  leftLabel, 
  rightLabel,
  className = ""
}: ToggleSwitchProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`transition-colors uppercase text-xs font-semibold ${!checked ? 'text-gray-600' : 'text-gray-400'}`}>
        {leftLabel}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
          ${checked ? 'bg-gray-600' : 'bg-gray-300'}
        `}
      >
        <div
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white
            transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      <div className={`transition-colors uppercase text-xs font-semibold ${checked ? 'text-gray-600' : 'text-gray-400'}`}>
        {rightLabel}
      </div>
    </div>
  );
}
