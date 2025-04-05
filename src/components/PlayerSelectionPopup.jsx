// src/components/PlayerSelectionPopup.jsx
import React, { useState, useEffect } from 'react';

const PlayerSelectionPopup = ({ battingTeam = [], bowlingTeam = [], onDone, onClose }) => {
  const [firstBatsman, setFirstBatsman] = useState('');
  const [secondBatsman, setSecondBatsman] = useState('');
  const [bowler, setBowler] = useState('');

  // Clear the second batsman when the first batsman changes
  useEffect(() => {
    setSecondBatsman(''); // Reset second batsman when the first batsman changes
  }, [firstBatsman]);

  // Debugging: Check if teams are correctly passed
  useEffect(() => {
    console.log("Batting Team:", battingTeam);
    console.log("Bowling Team:", bowlingTeam);
  }, [battingTeam.length, bowlingTeam.length]); // Depend on the length of the arrays

  const handleDone = () => {
    if (!firstBatsman || !secondBatsman || !bowler) {
      alert('Please select both batsmen and a bowler.');
      return;
    }

    const selectedPlayers = { firstBatsman, secondBatsman, bowler };

    onDone(selectedPlayers); // Send data back to the parent
    onClose(); // Close the popup
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <button onClick={onClose} className="absolute top-2 right-4 text-xl text-gray-600">&times;</button>
        
        <h2 className="text-lg font-bold text-center mb-4">Select Players</h2>

        {/* Batsman Selection */}
        <div className="mb-4">
          <label className="block mb-2">Batsman</label>
          <select
            value={firstBatsman}
            onChange={(e) => setFirstBatsman(e.target.value)}
            className="w-full border p-2 rounded mb-2"
          >
            <option value="">Select First Batsman</option>
            {battingTeam.map((player) => (
              <option key={player._id} value={player._id}>{player.name}</option>
            ))}
          </select>

          <select
            value={secondBatsman}
            onChange={(e) => setSecondBatsman(e.target.value)}
            className="w-full border p-2 rounded"
            disabled={!firstBatsman}
          >
            <option value="">Select Second Batsman</option>
            {battingTeam
              .filter((player) => player._id !== firstBatsman)
              .map((player) => (
                <option key={player._id} value={player._id}>{player.name}</option>
              ))}
          </select>
        </div>

        {/* Bowler Selection */}
        <div className="mb-4">
          <label className="block mb-2">Bowler</label>
          <select
            value={bowler}
            onChange={(e) => setBowler(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Bowler</option>
            {bowlingTeam.map((player) => (
              <option key={player._id} value={player._id}>{player.name}</option>
            ))}
          </select>
        </div>

        {/* Done Button */}
        <div className="flex justify-between">
          <button
            onClick={handleDone}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSelectionPopup;
