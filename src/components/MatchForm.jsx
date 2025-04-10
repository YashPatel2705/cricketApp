// FILE: src/components/MatchForm.jsx
import React, { useState, useEffect } from 'react';
import useTeamStore from '../store/useTeamStore';
import useMatchStore from '../store/useMatchStore';

const stages = ['Group', 'Quarter', 'Semi', 'Final'];
const grounds = ['Ground 1', 'Ground 2'];

const MatchForm = ({ onClose, initialValues }) => {
  const { teams, fetchTeams } = useTeamStore();
  const { createMatch, updateMatch } = useMatchStore();

  const [teamA, setTeamA] = useState(initialValues?.teamA?._id || '');
  const [teamB, setTeamB] = useState(initialValues?.teamB?._id || '');
  const [stage, setStage] = useState(initialValues?.stage || 'Group');
  const [date, setDate] = useState(
    initialValues?.date ? new Date(initialValues.date).toISOString().slice(0, 16) : ''
  );
  const [ground, setGround] = useState(initialValues?.ground || 'Ground 1');
  const [overs, setOvers] = useState(initialValues?.overs || 20);

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (teamA === teamB) {
      alert('❌ Team A and Team B must be different.');
      return;
    }

    const selectedDate = new Date(date);
    if (selectedDate < new Date()) {
      alert('❌ Match date must be in the future or current time.');
      return;
    }

    const payload = { teamA, teamB, stage, date, ground, overs };

    if (initialValues?._id) {
      await updateMatch(initialValues._id, payload);
    } else {
      await createMatch(payload);
    }

    // Store overs in localStorage as well
    localStorage.setItem('lastMatchOvers', overs);

    onClose();
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">
        {initialValues ? 'Edit Match' : 'Create Match'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Team A</label>
          <select value={teamA} onChange={(e) => setTeamA(e.target.value)} required className="w-full border p-2 rounded">
            <option value="">Select Team A</option>
            {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block mb-1">Team B</label>
          <select value={teamB} onChange={(e) => setTeamB(e.target.value)} required className="w-full border p-2 rounded">
            <option value="">Select Team B</option>
            {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block mb-1">Match Date & Time</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block mb-1">Stage</label>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full border p-2 rounded">
            {stages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block mb-1">Ground</label>
          <select value={ground} onChange={(e) => setGround(e.target.value)} className="w-full border p-2 rounded">
            {grounds.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="block mb-1">Overs</label>
          <input type="number" min="1" max="50" value={overs} onChange={(e) => setOvers(Number(e.target.value))} required className="w-full border p-2 rounded" />
        </div>

        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          {initialValues ? 'Update Match' : 'Save Match'}
        </button>
      </form>
    </div>
  );
};

export default MatchForm;
