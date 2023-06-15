import { Component } from 'solid-js';
import { Router, Routes, Route } from '@solidjs/router';

import './fonts.css';
import './index.css';

import HomePage from './pages/HomePage';

const App: Component = () => {
  return (
    <Router>
      <Routes>
        <Route path={['/', '/home']} component={HomePage} />
        {/* <Route path="/home"/> */}
        {/* <Route path="/home"/> */}
      </Routes>
    </Router>
  );
};

export default App;
