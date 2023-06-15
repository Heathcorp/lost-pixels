import { Component, JSX } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';

import Text from '../components/Text';
import LogoType from '../components/LogoType';
import Box from '../components/Box';

import './pages.css';
import FlexDivider from '../components/FlexDivider';

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
      <div
        style={{
          display: 'flex',
          'flex-direction': 'row',
          gap: '0.25rem',
          padding: '0.25rem',
        }}
      >
        <Box>
          <LogoType />
        </Box>
        <Box
          style={{
            flex: 1,
            display: 'flex',
            'flex-direction': 'row',
            'justify-content': 'space-around',
            'align-items': 'center',
            gap: '0.25rem',
          }}
        >
          <Text class="clickable  heading-1" value="About" disabled />
          <FlexDivider />
          <Text class="clickable disabled heading-1" value="Random" disabled />
          <FlexDivider />
          <Text class="clickable disabled heading-1" value="Search" disabled />
          <FlexDivider />
          <Text class="clickable disabled heading-1" value="Contact" disabled />
        </Box>
      </div>
    </div>
  );
};

export default HomePage;
