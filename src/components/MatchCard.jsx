// FILE: src/components/MatchCard.jsx
import React from 'react';
import dayjs from 'dayjs';
import { FaTrash, FaEdit } from 'react-icons/fa';

const MatchCard = ({ match, onDelete, onEdit }) => {
  const { teamA, teamB, stage, date, status, result, ground } = match;

  return (
    <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center text-center gap-3">
      <div className="flex items-center gap-3 justify-center">
        {teamA?.image && (
          <img
            src={`http://localhost:5000${teamA.image}`}
            alt="Team A"
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <span className="font-semibold text-sm">{teamA?.name}</span>
        <span className="text-gray-500 text-xs">vs</span>
        <span className="font-semibold text-sm">{teamB?.name}</span>
        {teamB?.image && (
          <img
            src={`http://localhost:5000${teamB.image}`}
            alt="Team B"
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
      </div>

      <div className="text-sm text-gray-600">
        <div>{dayjs(date).format('MMM D, YYYY h:mm A')}</div>
        <div className="capitalize text-xs">{stage} Stage</div>
        <div className="text-xs text-gray-500 italic">Ground: {ground}</div>
        {status === 'completed' && result && (
          <div className="text-green-700 font-medium mt-1">{result}</div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            status === 'scheduled'
              ? 'bg-yellow-100 text-yellow-700'
              : status === 'live'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {status.toUpperCase()}
        </span>

        <FaEdit
          onClick={onEdit}
          className="text-blue-500 cursor-pointer hover:scale-110 transition"
          title="Edit Match"
        />
        <FaTrash
          onClick={() => onDelete(match._id)}
          className="text-red-500 cursor-pointer hover:scale-110 transition"
          title="Delete Match"
        />
      </div>
    </div>
  );
};

export default MatchCard;
