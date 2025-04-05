// store/usePlayerStore.js
import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/players';

const usePlayerStore = create((set, get) => ({
  players: [],
  loading: false,
  error: null,

  fetchPlayers: async (query = '') => {
    set({ loading: true });
    try {
      const res = await axios.get(`${API_URL}${query}`);
      set({ players: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addPlayer: async (player) => {
    try {
      const res = await axios.post(API_URL, player);
      set({ players: [...get().players, res.data] });
    } catch (err) {
      set({ error: err.message });
    }
  },

  updatePlayer: async (player) => {
    try {
      const res = await axios.put(`${API_URL}/${player._id}`, player);
      set({
        players: get().players.map(p =>
          p._id === player._id ? res.data : p
        )
      });
    } catch (err) {
      set({ error: err.message });
    }
  },

  deletePlayer: async (player) => {
    try {
      await axios.delete(`${API_URL}/${player._id}`);
      set({ players: get().players.filter(p => p._id !== player._id) });
    } catch (err) {
      set({ error: err.message });
    }
  }
}));

export default usePlayerStore;
