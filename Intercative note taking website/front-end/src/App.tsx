import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginCard } from "./components/LoginCard";
import { NotesPage } from './components/NotesPage';
import { DarkModeProvider } from './DarkModeContext';

export const App: React.FC = () => {
  return (
    <DarkModeProvider> {/* Wrap the entire app with the DarkModeProvider */}
      <Router>
        <Routes>
          {/* Define the routes */}
          <Route path="/" element={<LoginCard />} /> {/* Login Page */}
          <Route path="/notes" element={<NotesPage />} /> {/* Notes Page */}
        </Routes>
      </Router>
    </DarkModeProvider>
  );
};

export default App;

