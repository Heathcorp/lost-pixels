import { Component } from 'solid-js';
import { Router, Routes, Route } from '@solidjs/router';

import './fonts.css';
import './index.css';

import HomePage from './pages/HomePage';
import ExperimentPage from './pages/ExperimentPage';

const App: Component = () => {
  return (
    <Router>
      <Routes>
        <Route path={['/', '/*']} component={HomePage} />
        <Route path="/experiment/:experimentId?" component={ExperimentPage} />
        {/* <Route path="/home"/> */}
      </Routes>
    </Router>
  );
};

export default App;
