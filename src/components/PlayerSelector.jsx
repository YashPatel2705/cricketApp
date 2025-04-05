import React from 'react';
import { FaTimes } from 'react-icons/fa';

const PlayerSelectorModal = ({ isOpen, onClose, team, selectedBatsmen, selectedBowler, onSelectBatsman, onSelectBowler }) => {
  if (!isOpen) return null;

  const handleBatsmanClick = (player) => {
    if (selectedBatsmen.length < 2) {
      onSelectBatsman(player);
    }
  };

  const handleBowlerClick = (player) => {
    onSelectBowler(player);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center">
      <div className="bg-white p-6 rounded w-full max-w-lg relative">
        <button onClick={onClose} className="absolute right-3 top-2 text-gray-600 text-xl">
          <FaTimes />
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">Select Players</h2>

        <div>
          <h3 className="text-lg font-semibold">Batsmen</h3>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {team.players.filter(player => player.role === 'batsman').map(player => (
              <button
                key={player._id}
                className={`px-4 py-2 rounded ${selectedBatsmen.includes(player) ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                onClick={() => handleBatsmanClick(player)}
                disabled={selectedBatsmen.includes(player)}
              >
                {player.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold">Bowler</h3>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {team.players.filter(player => player.role === 'bowler').map(player => (
              <button
                key={player._id}
                className={`px-4 py-2 rounded ${selectedBowler === player ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => handleBowlerClick(player)}
                disabled={selectedBowler === player}
              >
                {player.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="bg-blue-500 text-white py-2 px-4 rounded">
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSelectorModal;
