// FILE: src/pages/LiveScoring/LiveScoringPanel.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useMatchStore from '../../store/useMatchStore';
import useTeamStore from '../../store/useTeamStore';
import socket from '../../utils/socket';

const LiveScoringPanel = () => {
  const { matchId } = useParams();
  const { matches, fetchMatches } = useMatchStore();
  const { teams, fetchTeams } = useTeamStore();

  const [batsman1, setBatsman1] = useState(null);
  const [batsman2, setBatsman2] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [match, setMatch] = useState(null);
  const [toss, setToss] = useState(null);
  const [isMatchStarted, setIsMatchStarted] = useState(false);
  const [isMatchPaused, setIsMatchPaused] = useState(false);
  const [recentBalls, setRecentBalls] = useState([]);
  const [overStarted, setOverStarted] = useState(false);

  useEffect(() => {
    fetchMatches();
    fetchTeams();
  }, []);

  useEffect(() => {
    const m = matches.find(m => m._id === matchId);
    if (m) {
      setMatch(m);
      const tossData = JSON.parse(localStorage.getItem(`toss-${matchId}`));
      const playerData = JSON.parse(localStorage.getItem(`players-${matchId}`));

      if (tossData) setToss(tossData);

      if (playerData) {
        const battingTeam = teams.find(t => t._id === tossData?.batFirst);
        const bowlingTeam = teams.find(t => t._id === tossData?.bowlFirst);

        setBatsman1(battingTeam?.players.find(p => p.player._id === playerData.batsman1)?.player);
        setBatsman2(battingTeam?.players.find(p => p.player._id === playerData.batsman2)?.player);
        setBowler(bowlingTeam?.players.find(p => p.player._id === playerData.bowler)?.player);
      }
    }
  }, [matches, teams]);

  const handleStartPause = () => {
    if (isMatchStarted) {
      setIsMatchPaused(!isMatchPaused);
    } else {
      setIsMatchStarted(true);
      setIsMatchPaused(false);
    }
  };

  const handleFinish = () => {
    setIsMatchStarted(false);
    setIsMatchPaused(false);
    setOverStarted(false);
  };

  const handleBallEvent = (event) => {
    const updated = [event, ...recentBalls];
    if (updated.length > 6) updated.pop();
    setRecentBalls(updated);
  };

  const handleToggleOver = () => {
    setOverStarted(!overStarted);
  };

  const battingTeamName = teams.find(t => t._id === toss?.batFirst)?.name;

  return (
    <div className="p-4 space-y-4 w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#f5f7fa] to-[#e4ebf5] text-gray-800 pb-36">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-extrabold text-indigo-800">Live Scoring</h2>
        <div className="flex gap-2">
          <button
            onClick={handleStartPause}
            className={`px-4 py-1.5 rounded-full text-white font-semibold shadow transition duration-300 ${isMatchStarted ? (isMatchPaused ? 'bg-green-500' : 'bg-yellow-500') : 'bg-blue-600'}`}
          >
            {isMatchStarted ? (isMatchPaused ? 'Resume' : 'Pause') : 'Start'}
          </button>
          <button
            onClick={handleFinish}
            className="bg-red-600 px-4 py-1.5 rounded-full text-white font-semibold shadow"
          >
            Finish
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md">
        <p className="font-semibold text-base text-center">{match?.teamA.name} <span className="text-indigo-500">vs</span> {match?.teamB.name}</p>
        <p className="text-xs text-gray-500 text-center">{new Date(match?.date).toLocaleString()}</p>
        {toss && (
          <p className="text-xs mt-2 text-blue-600 bg-blue-100 text-center px-3 py-1 rounded-full shadow-sm">
            {teams.find(t => t._id === toss.tossWinner)?.name} won the toss and elected to bat
          </p>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md relative">
        <div className="absolute right-4 top-4 text-right">
          <p className="text-xs font-semibold text-gray-800">{battingTeamName}</p>
          <p className="text-xs text-gray-600">0/0 (0.0)</p>
          <p className="text-xs text-gray-600">RR: 0.00</p>
        </div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Batsmen</h3>
        {batsman1 && <p className="text-sm">🟢 <span className="font-medium">{batsman1.name}</span> <span className="text-gray-600 ml-2">10(12)</span></p>}
        {batsman2 && <p className="text-sm">⚪ <span className="font-medium">{batsman2.name}</span> <span className="text-gray-600 ml-2">8(10)</span></p>}
        <button className="text-indigo-500 text-xs mt-1">✏️ Change</button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Bowler</h3>
        {bowler && <p className="text-sm">🎯 <span className="font-medium">{bowler.name}</span></p>}
        <button className="text-indigo-500 text-xs mt-1">✏️ Change</button>
      </div>

      {isMatchStarted && !isMatchPaused && overStarted && (
        <>
          <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ball Events</h3>
            <div className="grid grid-cols-5 gap-3 text-center text-sm font-medium">
              {['0', '1', '2', '3', '4', '6', 'W', 'Wd', 'Nb', 'Lb'].map(event => (
                <button
                  key={event}
                  className="bg-indigo-100 text-indigo-700 py-2 rounded-lg shadow hover:bg-indigo-200 transition"
                  onClick={() => handleBallEvent(event)}
                >
                  {event}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Balls</h3>
            <div className="flex gap-2 flex-wrap">
              {recentBalls.map((ball, index) => (
                <span key={index} className={`px-3 py-1 rounded-full text-xs font-bold text-white ${ball === 'W' ? 'bg-red-500' : 'bg-indigo-500'}`}>{ball}</span>
              ))}
            </div>
          </div>
        </>
      )}

      {isMatchStarted && !isMatchPaused && (
        <div className="fixed bottom-16 left-0 right-0 px-6 max-w-md mx-auto">
          <div className="flex justify-between gap-4">
            <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-full font-semibold shadow hover:bg-gray-200 transition">↩️ Undo</button>
            <button
              onClick={handleToggleOver}
              className={`flex-1 ${overStarted ? 'bg-red-600' : 'bg-blue-600'} text-white py-3 rounded-full font-semibold shadow hover:opacity-90 transition`}
            >
              {overStarted ? '⛔ End Over' : '⏭️ Start Over'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScoringPanel;
