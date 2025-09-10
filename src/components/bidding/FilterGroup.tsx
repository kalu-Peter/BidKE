import React from "react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterGroupProps {
  label: string;
  options: FilterOption[];
  selected: string;
  onChange: (value: string) => void;
}

const FilterGroup: React.FC<FilterGroupProps> = ({ label, options, selected, onChange }) => (
  <div className="mb-4">
    <label className="block font-semibold mb-1">{label}</label>
    <select
      className="w-full border rounded px-3 py-2"
      value={selected}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">All</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default FilterGroup;
