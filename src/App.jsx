import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import ManagePlayers from './pages/Players/ManagePlayers';
import PlayerFormPage from './pages/Players/PlayerFormPage';
import ManageTeams from './pages/Teams/ManageTeams';
import ManageMatches from './pages/Matches/ManageMatches';
function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          <Route path="/" element={<ManagePlayers />} />
          <Route path="/player-form" element={<PlayerFormPage />} />
          <Route path="/teams" element={<ManageTeams />} />
          <Route path="/matches" element={<ManageMatches />} />
        </Routes>

        <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-2">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-500'}>Players</NavLink>
          <NavLink to="/teams" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-500'}>Teams</NavLink>
          <NavLink to="/matches" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-500'}>Matches</NavLink>
          <span className="text-gray-400">Settings</span>
        </nav>
      </div>
    </Router>
  );
}

export default App;
