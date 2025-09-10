import React from "react";

interface ReserveIndicatorProps {
  met: boolean;
}

const ReserveIndicator: React.FC<ReserveIndicatorProps> = ({ met }) => (
  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${met ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
    {met ? 'Reserve met' : 'Reserve not met'}
  </span>
);

export default ReserveIndicator;
