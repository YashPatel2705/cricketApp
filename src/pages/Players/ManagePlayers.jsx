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
      className="p-4 pb-20"
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-xl font-semibold">←</span>
        <h1 className="text-lg font-bold">Manage Players</h1>
        <button onClick={() => navigate('/player-form')} className="text-xl font-bold">＋</button>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search players..."
        className="w-full mb-4 px-4 py-2 border rounded-md text-sm"
      />

      <FilterTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="mt-4 space-y-3">
        <AnimatePresence>
          {players.map((player, index) => (
            <motion.div
              key={player._id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
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
