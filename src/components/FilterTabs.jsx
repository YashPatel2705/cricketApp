import React from 'react';

const tabs = ['All Players', 'Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'];

const FilterTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-3 py-1 text-sm rounded-full border ${activeTab === tab ? 'bg-blue-500 text-white' : 'text-gray-700 bg-gray-100'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;