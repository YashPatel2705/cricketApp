// pages/ManagePlayers.jsx
import React, { useState, useEffect } from 'react';
import PlayerCard from '../../components/PlayerCard';
import FilterTabs from '../../components/FilterTabs';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../../store/usePlayerStore';
import { motion, AnimatePresence } from 'framer-motion';

const ManagePlayers = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Players');
  const [searchTerm, setSearchTerm] = useState('');
  const { players, fetchPlayers, deletePlayer } = usePlayerStore();

  const fetchFilteredPlayers = () => {
    const queryParams = new URLSearchParams();
    if (activeTab !== 'All Players') queryParams.append('role', activeTab.toLowerCase());
    if (searchTerm) queryParams.append('search', searchTerm);
    const queryString = `?${queryParams.toString()}`;
    fetchPlayers(queryString);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(fetchFilteredPlayers, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, activeTab]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 pb-20 min-h-screen bg-[#FFF8F1] font-sans"
    >
      <div className="flex justify-between items-center mb-6">
        <span className="text-xl font-semibold cursor-pointer">←</span>
        <h1 className="text-2xl font-bold text-[#F76C2A]">Manage Players</h1>
        <button
          onClick={() => navigate('/player-form')}
          className="text-white bg-[#F76C2A] hover:bg-orange-600 px-5 py-2.5 rounded-lg shadow-md text-sm md:text-base"
        >
          ＋ Add Player
        </button>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search players..."
        className="w-full mb-4 px-4 py-3 border-2 border-[#DBDBDC] rounded-lg shadow-sm focus:outline-none focus:border-[#F76C2A]"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {['All Players', 'Batsman', 'Bowler', 'Wicket Keeper'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm md:text-base transition-colors duration-200 ${
              activeTab === tab
                ? 'bg-[#F76C2A] text-white'
                : 'bg-[#FFE8D9] text-[#F76C2A] hover:bg-[#F76C2A] hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <AnimatePresence>
          {players.map((player, index) => (
            <motion.div
              key={player._id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-xl"
            >
              <PlayerCard player={player} onDelete={deletePlayer} />
            </motion.div>
          ))}
        </AnimatePresence>

        {players.length === 0 && (
          <p className="text-center text-sm text-gray-500">No players found.</p>
        )}
      </div>
    </motion.div>
  );
};

export default ManagePlayers;