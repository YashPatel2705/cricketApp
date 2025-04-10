import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import ManagePlayers from './pages/Players/ManagePlayers';
import PlayerFormPage from './pages/Players/PlayerFormPage';
import ManageTeams from './pages/Teams/ManageTeams';
import ManageMatches from './pages/Matches/ManageMatches';
import LiveScoringWrapper from './pages/LiveScoringWrapper';
import PointsTable from './pages/PointsTable/PointsTable';
import { testApiConnection } from './utils/apiTest';

function App() {
  const [apiStatus, setApiStatus] = useState(null);

  const handleTestApi = async () => {
    const isAvailable = await testApiConnection();
    setApiStatus(isAvailable ? 'API is available!' : 'API is not available');
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
  
        
        <Routes>
          <Route path="/" element={<ManagePlayers />} />
          <Route path="/player-form" element={<PlayerFormPage />} />
          <Route path="/teams" element={<ManageTeams />} />
          <Route path="/matches" element={<ManageMatches />} />
          <Route path="/live-scoring/:matchId" element={<LiveScoringWrapper />} />
          <Route path="/points-table" element={<PointsTable />} />
        </Routes>

        <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-2">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-500'}>Players</NavLink>
          <NavLink to="/teams" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-500'}>Teams</NavLink>
          <NavLink to="/matches" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-500'}>Matches</NavLink>
          <NavLink to="/points-table" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-500'}>Points Table</NavLink>
        </nav>
      </div>
    </Router>
  );
}

export default App;
