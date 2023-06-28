import { Component } from 'solid-js';
import { Router, Routes, Route } from '@solidjs/router';

import './fonts.css';
import './index.css';

import MainPage from './pages/MainPage';

const App: Component = () => {
  return (
    <Router>
      <Routes>
        <Route path={['/', '/*']} component={MainPage} />
      </Routes>
    </Router>
  );
};

export default App;
