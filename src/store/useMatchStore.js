// src/store/useMatchStore.js
import { create } from 'zustand';
import axios from 'axios';

const useMatchStore = create((set, get) => ({
  matches: [],
  error: null,

  fetchMatches: async () => {
    try {
      const res = await axios.get('/api/matches');
      set({ matches: res.data });
    } catch (err) {
      set({ error: err.message });
    }
  },

  fetchTeamsWithPlayers: async (teamIds) => {
    try {
      const teamA = await axios.get(`/api/teams/${teamIds.teamA}`);
      const teamB = await axios.get(`/api/teams/${teamIds.teamB}`);

      return { teamA: teamA.data, teamB: teamB.data };
    } catch (err) {
      console.error('Error fetching teams with players:', err);
      set({ error: err.message });
      return { teamA: null, teamB: null };
    }
  },

  createMatch: async (data) => {
    try {
      const payload = { ...data, overs: data.overs };
      const res = await axios.post('/api/matches', payload);
      set({ matches: [...get().matches, res.data] });
    } catch (err) {
      set({ error: err.message });
    }
  },

  updateMatch: async (id, data) => {
    try {
      const payload = { ...data, overs: data.overs };
      const res = await axios.put(`/api/matches/${id}`, payload);
      const updated = get().matches.map(m => m._id === id ? res.data : m);
      set({ matches: updated });
    } catch (err) {
      set({ error: err.message });
    }
  },

  deleteMatch: async (id) => {
    try {
      await axios.delete(`/api/matches/${id}`);
      set({ matches: get().matches.filter(m => m._id !== id) });
    } catch (err) {
      set({ error: err.message });
    }
  },
}));

export default useMatchStore;
