// FILE: src/pages/Matches/ManageMatches.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useMatchStore from '../../store/useMatchStore';
import MatchForm from '../../components/MatchForm';
import MatchCard from '../../components/MatchCard';
import TossPopup from '../../components/TossPopup';

const stages = ['Scheduled', 'Live', 'Completed'];

const ManageMatches = () => {
  const navigate = useNavigate();
  const { matches, fetchMatches, deleteMatch, updateMatch } = useMatchStore();
  const [stage, setStage] = useState('Scheduled');
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showTossPopup, setShowTossPopup] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      await deleteMatch(id);
    }
  };

  const now = new Date();
  const updatedMatches = matches.map((match) => ({
    ...match,
    status:
      match.status === 'scheduled' && new Date(match.date) <= now
        ? 'live'
        : match.status,
  }));

  const filteredMatches = updatedMatches.filter(m => m.status === stage.toLowerCase());

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-indigo-700">Manage Matches</h2>
        <button
          onClick={() => {
            setEditingMatch(null);
            setShowForm(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded"
        >
          + New Match
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {stages.map(s => (
          <button
            key={s}
            onClick={() => setStage(s)}
            className={`px-3 py-1 rounded-full text-sm ${stage === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredMatches.map(match => (
          <div key={match._id} className="relative">
            <MatchCard
              match={match}
              onDelete={handleDelete}
              onEdit={() => {
                setEditingMatch(match);
                setShowForm(true);
              }}
            />
            {(match.status === 'live' || match.status === 'scheduled') && (
              <button
                onClick={() => {
                  setSelectedMatch(match);
                  setShowTossPopup(true);
                }}
                className="absolute right-4 bottom-4 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded shadow"
              >
                Live Scoring
              </button>
            )}
          </div>
        ))}
        {filteredMatches.length === 0 && (
          <p className="text-gray-500 text-sm text-center">No matches found.</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded-lg w-full max-w-md relative">
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-2 text-gray-600 text-xl">&times;</button>
            <MatchForm
              onClose={() => {
                setShowForm(false);
                setEditingMatch(null);
              }}
              initialValues={editingMatch}
            />
          </div>
        </div>
      )}

      {showTossPopup && selectedMatch && (
        <TossPopup match={selectedMatch} onClose={() => setShowTossPopup(false)} />
      )}
    </div>
  );
};

export default ManageMatches;
