import React from "react";

interface SearchBarProps {
  placeholder: string;
  onSearch: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder, onSearch }) => {
  const [value, setValue] = React.useState("");

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md mx-auto mb-4">
      <input
        type="text"
        className="flex-1 border rounded-l px-4 py-2 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={handleInput}
      />
      <button type="submit" className="bg-primary text-white px-4 py-2 rounded-r">
        Search
      </button>
    </form>
  );
};

export default SearchBar;
