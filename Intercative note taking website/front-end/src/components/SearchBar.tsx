import React, { useState } from 'react';
import { useDarkMode } from '@/DarkModeContext';

export const SearchBar: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const {isDarkMode} = useDarkMode();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value); // Trigger the search functionality
  };

  return (
    <div className='mb-4'>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={handleSearch}
        className={isDarkMode ? 'search-bar-dark hover:bg-neutral-800' : 'search-bar hover:bg-[#dddacb]'}
      />
    </div>
  );
};
