import { Component, JSX } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';

import Text from '../components/Text';
import LogoType from '../components/LogoType';
import Box from '../components/Box';

import './pages.css';

const HomePage: Component = () => {
  return (
    <div
      class="homePageContainer"
      style={{
        display: 'flex',
        'flex-direction': 'column',
        'justify-content': 'start',
        'align-items': 'stretch',
      }}
    >
      <div style={{ display: 'flex', 'flex-direction': 'row' }}>
        <Box>
          <LogoType />
        </Box>
        <Box style={{ flex: '1' }}></Box>
      </div>
    </div>
  );
};

export default HomePage;
