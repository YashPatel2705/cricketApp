// pages/PointsTable.jsx
import React, { useEffect, useState } from 'react';
import useTeamStore from '../../store/useTeamStore';
import useMatchStore from '../../store/useMatchStore';
import { FaSync } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const PointsTable = () => {
  const { teams, fetchTeams } = useTeamStore();
  const { matches, fetchMatches } = useMatchStore();
  const [pointsTable, setPointsTable] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchTeams(), fetchMatches()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (teams.length > 0 && matches.length > 0) {
      calculatePointsTable();
    }
  }, [teams, matches]);

  const calculatePointsTable = () => {
    const initialTable = teams.map(team => ({
      teamId: team._id,
      name: team.name,
      logo: team.logo || '',
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      nrr: 0,
      points: 0,
      runsFor: 0,
      runsAgainst: 0,
      oversFor: 0,
      oversAgainst: 0,
    }));

    const completedMatches = matches.filter(match => match.status === 'completed');

    completedMatches.forEach(match => {
      const teamAIndex = initialTable.findIndex(t => t.teamId === match.teamA);
      const teamBIndex = initialTable.findIndex(t => t.teamId === match.teamB);

      if (teamAIndex >= 0 && teamBIndex >= 0) {
        initialTable[teamAIndex].matchesPlayed += 1;
        initialTable[teamBIndex].matchesPlayed += 1;

        if (
          match.teamAScore != null &&
          match.teamBScore != null &&
          match.overs &&
          match.overs > 0
        ) {
          initialTable[teamAIndex].runsFor += match.teamAScore;
          initialTable[teamAIndex].runsAgainst += match.teamBScore;
          initialTable[teamAIndex].oversFor += match.overs;
          initialTable[teamAIndex].oversAgainst += match.overs;

          initialTable[teamBIndex].runsFor += match.teamBScore;
          initialTable[teamBIndex].runsAgainst += match.teamAScore;
          initialTable[teamBIndex].oversFor += match.overs;
          initialTable[teamBIndex].oversAgainst += match.overs;
        }

        if (match.winner) {
          if (match.winner === match.teamA) {
            initialTable[teamAIndex].wins += 1;
            initialTable[teamAIndex].points += 2;
            initialTable[teamBIndex].losses += 1;
          } else if (match.winner === match.teamB) {
            initialTable[teamBIndex].wins += 1;
            initialTable[teamBIndex].points += 2;
            initialTable[teamAIndex].losses += 1;
          }
        }
      }
    });

    initialTable.forEach(team => {
      if (team.oversFor > 0 && team.oversAgainst > 0) {
        const runRateFor = team.runsFor / team.oversFor;
        const runRateAgainst = team.runsAgainst / team.oversAgainst;
        team.nrr = runRateFor - runRateAgainst;
      }
    });

    const sortedTable = initialTable.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });

    setPointsTable(sortedTable);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.4 }}
      className="p-4 font-sans bg-[#FFF8F1] min-h-screen"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <h2 className="text-2xl font-semibold text-[#F76C2A]">Points Table</h2>
        <button
          onClick={refreshData}
          className="bg-[#F76C2A] hover:bg-orange-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm md:text-base"
          disabled={isLoading}
        >
          <FaSync className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-[#DBDBDC] rounded-lg text-sm">
          <thead className="bg-[#FFF8F1]">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase">Team</th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase">M</th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase">W</th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase">L</th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase">NRR</th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase">Pts</th>
            </tr>
          </thead>
          <AnimatePresence>
            <tbody className="divide-y divide-[#DBDBDC]">
              {pointsTable.map((team, index) => (
                <motion.tr
                  key={team.teamId}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-[#FDEAD9] transition-colors duration-200"
                  style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FFF1E6' }}
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 mr-2 rounded-full bg-[#E5E7EB] flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">{team.name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-[#333]">{team.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">{team.matchesPlayed}</td>
                  <td className="py-3 px-4 text-center text-green-600 font-semibold">{team.wins}</td>
                  <td className="py-3 px-4 text-center text-red-500 font-semibold">{team.losses}</td>
                  <td className={`py-3 px-4 text-center font-semibold ${team.nrr >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {team.nrr.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-[#F76C2A]">{team.points}</td>
                </motion.tr>
              ))}
            </tbody>
          </AnimatePresence>
        </table>
      </div>

      {pointsTable.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No completed matches found.</p>
        </div>
      )}
    </motion.div>
  );
};

export default PointsTable;
