// FILE: src/components/TossPopup.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useTeamStore from '../store/useTeamStore';
import { useNavigate } from 'react-router-dom';

const TossPopup = ({ match, onClose }) => {
  const { teams, fetchTeams } = useTeamStore();
  const navigate = useNavigate(); 
  const [tossWinner, setTossWinner] = useState('');
  const [batFirst, setBatFirst] = useState('');
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [batsman1, setBatsman1] = useState('');
  const [batsman2, setBatsman2] = useState('');
  const [bowler, setBowler] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const battingTeam = teams.find(t => t._id === batFirst);
  const bowlingTeam = teams.find(t => t._id === (match.teamA._id === batFirst ? match.teamB._id : match.teamA._id));

  const handleContinue = () => {
    if (!tossWinner || !batFirst) {
      alert('Please select both toss winner and who bats first.');
      return;
    }

    const bowlFirst = match.teamA._id === batFirst ? match.teamB._id : match.teamA._id;

    const tossData = {
      tossWinner,
      batFirst,
      bowlFirst
    };

    localStorage.setItem(`toss-${match._id}`, JSON.stringify(tossData));
    setShowPlayerSelector(true);
  };

  const handleLetsPlay = () => {
    if (!batsman1 || !batsman2 || !bowler) {
      alert('Please select two batsmen and one bowler.');
      return;
    }

    const playerData = {
      batsman1,
      batsman2,
      bowler
    };

    localStorage.setItem(`players-${match._id}`, JSON.stringify(playerData));
    onClose();
    navigate(`/live-scoring/${match._id}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg space-y-5 relative"
      >
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-500 text-2xl">&times;</button>

        {!showPlayerSelector ? (
          <>
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

            <button
              onClick={handleContinue}
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
            >
              Save & Continue
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-center text-indigo-700">Select Players</h2>

            <div>
              <label className="block mb-1 font-medium">Batsman 1</label>
              <select
                value={batsman1}
                onChange={(e) => setBatsman1(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Select Player</option>
                {battingTeam?.players.map(p => (
                  batsman2 !== p.player._id && (
                    <option key={p.player._id} value={p.player._id}>{p.player.name}</option>
                  )
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Batsman 2</label>
              <select
                value={batsman2}
                onChange={(e) => setBatsman2(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Select Player</option>
                {battingTeam?.players.map(p => (
                  batsman1 !== p.player._id && (
                    <option key={p.player._id} value={p.player._id}>{p.player.name}</option>
                  )
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Bowler</label>
              <select
                value={bowler}
                onChange={(e) => setBowler(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Select Player</option>
                {bowlingTeam?.players.map(p => (
                  <option key={p.player._id} value={p.player._id}>{p.player.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLetsPlay}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Let's Play
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default TossPopup;
