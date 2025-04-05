import React from 'react';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PlayerCard = ({ player, onDelete }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      layout
      className="bg-white shadow-md rounded-xl p-4 mb-4 flex items-center justify-between"
    >
      <div>
        <h2 className="font-bold text-sm">{player.name}</h2>
        <p className="text-xs text-gray-600 capitalize">{player.role}</p>
      </div>
      <div className="flex space-x-2">
        <FaEdit className="text-blue-500 cursor-pointer" onClick={() => navigate('/player-form', { state: { player } })} />
        <FaTrash className="text-red-500 cursor-pointer" onClick={() => onDelete(player)} />
      </div>
    </motion.div>
  );
};

export default PlayerCard;