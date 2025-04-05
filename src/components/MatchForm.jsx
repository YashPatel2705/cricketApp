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

    const payload = { teamA, teamB, stage, date, ground };

    if (initialValues?._id) {
      await updateMatch(initialValues._id, payload);
    } else {
      await createMatch(payload);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-bold text-center">
        {initialValues ? 'Edit Match' : 'Create Match'}
      </h2>

      <div>
        <label className="block text-sm font-medium mb-1">Team A</label>
        <select
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Select Team A</option>
          {teams.map(team => (
            <option key={team._id} value={team._id}>{team.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Team B</label>
        <select
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Select Team B</option>
          {teams.map(team => (
            <option key={team._id} value={team._id}>{team.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Match Date & Time</label>
        <input
          type="datetime-local"
          className="w-full border p-2 rounded"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Stage</label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="w-full border p-2 rounded"
        >
          {stages.map(stageOption => (
            <option key={stageOption} value={stageOption}>{stageOption}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ground</label>
        <select
          value={ground}
          onChange={(e) => setGround(e.target.value)}
          className="w-full border p-2 rounded"
        >
          {grounds.map(groundOption => (
            <option key={groundOption} value={groundOption}>{groundOption}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
      >
        {initialValues ? 'Update Match' : 'Save Match'}
      </button>
    </form>
  );
};

export default MatchForm;
