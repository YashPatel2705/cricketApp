// FILE: src/components/TossPopup.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const oversOptions = [8, 10, 12, 15, 20];

const TossPopup = ({ match, onClose }) => {
  const [tossWinner, setTossWinner] = useState('');
  const [batFirst, setBatFirst] = useState('');
  const [overs, setOvers] = useState(10);

  const handleSave = () => {
    if (!tossWinner || !batFirst) {
      alert('Please select both toss winner and who bats first.');
      return;
    }
    const bowlFirst = match.teamA._id === batFirst ? match.teamB._id : match.teamA._id;
    const tossData = {
      tossWinner,
      bowlFirst,
      batFirst,
      overs
    };

    localStorage.setItem(`toss-${match._id}`, JSON.stringify(tossData));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg space-y-5 relative"
      >
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-500 text-2xl">&times;</button>

        <h2 className="text-lg font-semibold text-center text-indigo-700">Toss & Match Setup</h2>

        <div>
          <label className="block mb-1 font-medium">Who won the toss?</label>
          <select
            value={tossWinner}
            onChange={(e) => setTossWinner(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Team</option>
            <option value={match.teamA._id}>{match.teamA.name}</option>
            <option value={match.teamB._id}>{match.teamB.name}</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Who bats first?</label>
          <select
            value={batFirst}
            onChange={(e) => setBatFirst(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Team</option>
            <option value={match.teamA._id}>{match.teamA.name}</option>
            <option value={match.teamB._id}>{match.teamB.name}</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Total Overs</label>
          <select
            value={overs}
            onChange={(e) => setOvers(parseInt(e.target.value))}
            className="w-full border p-2 rounded"
          >
            {oversOptions.map(opt => (
              <option key={opt} value={opt}>{opt} Overs</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Save & Continue
        </button>
      </motion.div>
    </div>
  );
};

export default TossPopup;
