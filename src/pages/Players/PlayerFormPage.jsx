import React from 'react';
import { useLocation } from 'react-router-dom';
import PlayerForm from '../../components/PlayerForm';
import usePlayerStore from '../../store/usePlayerStore';
import { motion } from 'framer-motion';

const PlayerFormPage = () => {
  const location = useLocation();
  const editPlayer = location.state?.player || null;
  const { addPlayer, updatePlayer } = usePlayerStore();

  const handleSubmit = (playerData) => {
    if (editPlayer) {
      updatePlayer(playerData);
    } else {
      addPlayer(playerData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 pb-20"
    >
      <h1 className="text-lg font-bold mb-4 text-center">
        {editPlayer ? 'Edit Player' : 'Add Player'}
      </h1>
      <PlayerForm
        initialValues={editPlayer || { name: '', role: '' }}
        onSubmit={handleSubmit}
      />
    </motion.div>
  );
};

export default PlayerFormPage;