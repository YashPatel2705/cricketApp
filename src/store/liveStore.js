import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const useLiveStore = create((set, get) => ({
  match: null,
  players: [],
  striker: '',
  nonStriker: '',
  bowler: '',
  inningsStarted: false,

  fetchMatch: async (matchId) => {
    const res = await axios.get(`http://localhost:5000/api/matches/${matchId}`);
    const match = res.data;
    const teamAPlayers = match.teamA?.players || [];
    const teamBPlayers = match.teamB?.players || [];

    set({
      match,
      players: [...teamAPlayers, ...teamBPlayers],
    });

    socket.emit('get-live-match', matchId);
  },

  startMatch: ({ striker, nonStriker, bowler }) => {
    const match = get().match;
    if (!match) return;
    socket.emit('start-innings', {
      matchId: match._id,
      battingTeam: match.battingTeam,
      bowlingTeam: match.bowlingTeam,
      striker,
      nonStriker,
      bowler,
    });
    set({ inningsStarted: true, striker, nonStriker, bowler });
  },
}));

export default useLiveStore;
