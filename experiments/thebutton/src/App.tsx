import { Component } from 'solid-js';
import { Router, Routes, Route } from '@solidjs/router';

import './fonts.css';
import './index.css';

import FirebaseAppProvider from './contexts/FirebaseAppProvider';
import MainPage from './pages/MainPage';

// TODO: REFACTOR THIS
const App: Component = () => {
  return (
    <FirebaseAppProvider>
      <Router>
        <Routes>
          <Route path={['/', '/*']} component={MainPage} />
        </Routes>
      </Router>
    </FirebaseAppProvider>
  );
};

export default App;
