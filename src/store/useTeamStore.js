import { create } from 'zustand';
import axios from 'axios';

const useTeamStore = create((set, get) => ({
  teams: [],
  availablePlayers: [],

  fetchTeams: async () => {
    const res = await axios.get('/api/teams');
    set({ teams: res.data });
  },

  fetchAvailablePlayers: async () => {
    const res = await axios.get('/api/teams/available-players');
    set({ availablePlayers: res.data });
  },

  createTeam: async (formData) => {
    const res = await axios.post('/api/teams', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    set({ teams: [...get().teams, res.data] });
  },

  updateTeam: async (id, formData) => {
    const res = await axios.put(`/api/teams/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const updated = get().teams.map(t => t._id === id ? res.data : t);
    set({ teams: updated });
  },

  deleteTeam: async (id) => {
    await axios.delete(`/api/teams/${id}`);
    set({ teams: get().teams.filter(t => t._id !== id) });
  },
}));

export default useTeamStore;
