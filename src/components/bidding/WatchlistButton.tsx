import React from "react";

interface WatchlistButtonProps {
  watched: boolean;
  onToggle: () => void;
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({ watched, onToggle }) => (
  <button
    className={`ml-2 px-2 py-1 rounded border text-xs ${watched ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
    onClick={onToggle}
  >
    {watched ? 'Remove from Watchlist' : 'Add to Watchlist'}
  </button>
);

export default WatchlistButton;
