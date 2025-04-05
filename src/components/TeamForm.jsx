import React, { useEffect, useState } from 'react';
import useTeamStore from '../store/useTeamStore';
import CropImageModal from './CropImageModal';

const blobToFile = async (blob, fileName) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arrayBuffer = reader.result;
      const file = new File([arrayBuffer], fileName, { type: blob.type });
      resolve(file);
    };
    reader.readAsArrayBuffer(blob);
  });
};

const TeamForm = ({ onSubmit, initialValues }) => {
  const { fetchAvailablePlayers, availablePlayers } = useTeamStore();
  const [name, setName] = useState(initialValues?.name || '');
  const [desc, setDesc] = useState(initialValues?.description || '');
  const [imageFile, setImageFile] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState(() => {
    return initialValues?.players || [];
  });

  useEffect(() => {
    fetchAvailablePlayers();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file instanceof Blob) {
      setImageFile(file);
      setIsCropping(true);
      setShowCrop(true);
    }
  };

  const handlePlayerSelect = (playerId) => {
    setSelectedPlayers((prev) => {
      const exists = prev.find((p) => p.player === playerId);
      if (exists) {
        if (window.confirm('Are you sure you want to remove this player from the team?')) {
          return prev.filter((p) => p.player !== playerId);
        } else {
          return prev;
        }
      } else {
        return [...prev, { player: playerId, role: '' }];
      }
    });
  };

  const setRole = (roleType, playerId) => {
    setSelectedPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        role:
          p.player === playerId
            ? roleType
            : p.role === roleType
            ? ''
            : p.role,
      }))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isCropping) {
      alert('Please finish cropping the image before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', desc);
    formData.append('players', JSON.stringify(selectedPlayers));

    if (croppedBlob) {
      const file = await blobToFile(croppedBlob, 'logo.png');
      formData.append('image', file);
    }

    onSubmit(formData);
  };

  const filteredPlayers = availablePlayers.filter((p) =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="flex flex-col items-center">
        <label className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden cursor-pointer">
          <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
          {croppedBlob ? (
            <img src={URL.createObjectURL(croppedBlob)} alt="logo" className="object-cover w-full h-full rounded-full" />
          ) : initialValues?.image ? (
            <img src={`http://localhost:5000${initialValues.image}`} alt="logo" className="object-cover w-full h-full rounded-full" />
          ) : (
            <span className="text-sm text-gray-500 flex items-center justify-center h-full">Upload Logo</span>
          )}
        </label>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Team Name"
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description (Optional)"
        className="w-full border p-2 rounded"
      />

      <div>
        <h3 className="font-medium mb-2">Select Players</h3>
        <input
          type="text"
          placeholder="Search players..."
          value={playerSearch}
          onChange={(e) => setPlayerSearch(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        {filteredPlayers.map((player) => {
          const isSelected = selectedPlayers.find((p) => p.player === player._id);
          return (
            <div key={player._id} className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={!!isSelected} onChange={() => handlePlayerSelect(player._id)} />
              <span>{player.name}</span>
              {isSelected && (
                <div className="ml-auto flex gap-1">
                  <button
                    type="button"
                    onClick={() => setRole('C', player._id)}
                    className={`px-2 py-1 rounded text-xs ${isSelected.role === 'C' ? 'bg-blue-500 text-white' : 'border'}`}
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('VC', player._id)}
                    className={`px-2 py-1 rounded text-xs ${isSelected.role === 'VC' ? 'bg-green-500 text-white' : 'border'}`}
                  >
                    VC
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('WK', player._id)}
                    className={`px-2 py-1 rounded text-xs ${isSelected.role === 'WK' ? 'bg-yellow-500 text-white' : 'border'}`}
                  >
                    WK
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="submit"
        className={`w-full text-white p-2 rounded ${isCropping ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500'}`}
        disabled={isCropping}
      >
        {isCropping ? 'Cropping...' : 'Save Team'}
      </button>

      {showCrop && imageFile && (
        <CropImageModal
          image={URL.createObjectURL(imageFile)}
          onClose={() => {
            setShowCrop(false);
            setIsCropping(false);
          }}
          onCropComplete={(blob) => {
            setCroppedBlob(blob);
            setShowCrop(false);
            setIsCropping(false);
          }}
        />
      )}
    </form>
  );
};

export default TeamForm;
