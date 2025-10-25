// app/components/LocationInput.tsx

import React from 'react';
import { LocationSuggestion } from '../types';

interface LocationInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suggestions: LocationSuggestion[];
  onSelect: (location: LocationSuggestion) => void;
  placeholder: string;
  icon: React.ReactNode;
  showSuggestions: boolean;
  onFocus: () => void;
  onBlur: () => void;
  currentLocationHandler?: () => void;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  suggestions,
  onSelect,
  placeholder,
  icon,
  showSuggestions,
  onFocus,
  onBlur,
  currentLocationHandler
}) => (
  <div className="relative w-full mb-4">
    <div className="relative">
      <input 
        type="text" 
        placeholder={placeholder}
        className="w-full p-3 border border-gray-300 rounded-lg pl-10 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <div className="absolute left-3 top-3 text-gray-500">
        {icon}
      </div>
      {currentLocationHandler && (
        <button 
          onClick={currentLocationHandler}
          className="absolute right-3 top-3 text-gray-500 hover:text-amber-600 transition-colors"
          title="Use current location"
          type="button"
        >
          <i className="ri-navigation-fill text-lg"></i>
        </button>
      )}
    </div>
    {showSuggestions && suggestions.length > 0 && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
        {suggestions.map((item, index) => (
          <div 
            key={index}
            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
            onMouseDown={() => onSelect(item)}
          >
            <div className="flex items-center">
              <i className="ri-map-pin-line text-gray-400 mr-2"></i>
              <span className="text-sm">{item.display}</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);