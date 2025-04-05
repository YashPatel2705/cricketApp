import React, { useEffect, useState } from 'react';
import useTeamStore from '../../store/useTeamStore';
import TeamForm from '../../components/TeamForm';

const PlayerRow = ({ teamId, player, role, onRemove, onRoleChange }) => {
  const confirmAndRemove = () => {
    if (window.confirm(`Remove player '${player.name}' from this team?`)) {
      onRemove(teamId, player._id);
    }
  };

  return (
    <div className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded transition-transform duration-300 ease-in-out">
      <span className="text-sm text-gray-700">{player.name}</span>
      <div className="flex gap-1">
        {['C', 'VC', 'WK'].map((r) => (
          <button
            key={`role-${player._id}-${r}`}
            onClick={() => onRoleChange(teamId, player._id, r)}
            className={`px-2 py-0.5 text-xs rounded ${
              role === r
                ? r === 'C'
                  ? 'bg-purple-600 text-white'
                  : r === 'VC'
                  ? 'bg-sky-600 text-white'
                  : 'bg-amber-400 text-black'
                : 'border border-gray-300 text-gray-600'
            }`}
          >
            {r}
          </button>
        ))}
        <button
          onClick={confirmAndRemove}
          className="text-red-600 text-xs px-2 py-0.5 rounded hover:bg-red-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const ManageTeams = () => {
  const { teams, fetchTeams, deleteTeam, updateTeam, createTeam } = useTeamStore();
  const [editTeam, setEditTeam] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleRoleChange = async (teamId, playerId, newRole) => {
    const team = teams.find(t => t._id === teamId);
    const updatedPlayers = team.players.map(p =>
      p.player._id === playerId
        ? { ...p, role: newRole }
        : p.role === newRole
        ? { ...p, role: '' }
        : p
    );

    const formData = new FormData();
    formData.append('name', team.name);
    formData.append('description', team.description || '');
    formData.append('players', JSON.stringify(updatedPlayers.map(p => ({
      player: p.player._id,
      role: p.role
    }))));

    await updateTeam(teamId, formData);
  };

  const handleRemovePlayer = async (teamId, playerId) => {
    const team = teams.find(t => t._id === teamId);
    const updatedPlayers = team.players.filter(p => p.player._id !== playerId);

    const formData = new FormData();
    formData.append('name', team.name);
    formData.append('description', team.description || '');
    formData.append('players', JSON.stringify(updatedPlayers.map(p => ({
      player: p.player._id,
      role: p.role
    }))));

    await updateTeam(teamId, formData);
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-2xl font-semibold text-indigo-700">Manage Teams</h2>
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded"
          onClick={() => setShowForm(true)}
        >
          + New Team
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search teams..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredTeams.map(team => (
        <div key={team._id} className="bg-white border rounded shadow-sm mb-4 p-4 relative">
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={() => {
                setEditTeam(team);
                setShowForm(true);
              }}
              className="text-blue-600"
            >
              ✏️
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete team '${team.name}'?`)) {
                  deleteTeam(team._id);
                }
              }}
              className="text-red-600"
            >
              🗑️
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center sm:items-start sm:flex-col gap-4 sm:gap-0">
              {team.image && (
                <img
                  src={`http://localhost:5000${team.image}`}
                  className="w-20 h-20 object-cover rounded-full border"
                  alt="Team Logo"
                />
              )}
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 sm:mt-2">{team.name}</h3>
            </div>

            <div className="flex-1">
              <div className="grid gap-2 mt-4 sm:mt-0">
                {team.players.map((p, idx) =>
                  p.player && (
                    <PlayerRow
                      key={`${team._id}-${p.player._id}-${idx}`}
                      teamId={team._id}
                      player={p.player}
                      role={p.role}
                      onRemove={handleRemovePlayer}
                      onRoleChange={handleRoleChange}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow relative">
            <button
              className="absolute top-2 right-4 text-xl text-gray-600"
              onClick={() => {
                setShowForm(false);
                setEditTeam(null);
              }}
            >
              ×
            </button>
            <TeamForm
            onSubmit={async (formData) => {
              if (editTeam) {
                await updateTeam(editTeam._id, formData);
              } else {
                await createTeam(formData);
              }
          
              await fetchTeams(); // ✅ refresh the list
              setShowForm(false);
              setEditTeam(null);
            }}
            initialValues={editTeam}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTeams;
