import { create } from 'zustand';

const useLiveMatchStore = create((set) => ({
  battingTeamId: 'bat-team-1',
  bowlingTeamId: 'bowl-team-1',
  players: {
    'bat-team-1': [
      { _id: 'p1', name: 'Virat Kohli' },
      { _id: 'p2', name: 'Rohit Sharma' },
      { _id: 'p3', name: 'Shubman Gill' }
    ],
    'bowl-team-1': [
      { _id: 'p4', name: 'Bumrah' },
      { _id: 'p5', name: 'Siraj' }
    ]
  },
  striker: null,
  nonStriker: null,
  bowler: null,
  setStriker: (id) => set({ striker: id }),
  setNonStriker: (id) => set({ nonStriker: id }),
  setBowler: (id) => set({ bowler: id })
}));

export default useLiveMatchStore;
