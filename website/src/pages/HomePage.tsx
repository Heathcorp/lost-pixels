import { Component, For, JSX } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';

import Text from '../components/Text';
import LogoType from '../components/LogoType';
import Box from '../components/Box';

import './pages.css';
import FlexDivider from '../components/FlexDivider';
import VanishingScroll from '../components/VanishingScroll';

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
      {/* Header bar */}
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
          <Text class="clickable heading-1" value="About" />
          <FlexDivider />
          <Text class="clickable disabled heading-1" value="Random" />
          <FlexDivider />
          <Text class="clickable disabled heading-1" value="Search" />
          <FlexDivider />
          <Text class="clickable disabled heading-1" value="Contact" />
        </Box>
      </div>
      {/* Content */}
      <VanishingScroll>
        <div
          style={{
            display: 'flex',
            'flex-direction': 'row',
            'flex-wrap': 'wrap',
          }}
        >
          <For
            each={[
              1, 2, 3, 4, 6, 78, 80, 5, 6, 8, 45, 6, 45, 6, 345, 864, 5345,
              4562, 54, 5, 452, 54, 45, 54, 45, 6587, 2, 3, 4, 6, 78, 80, 5, 6,
              8, 45, 6, 45, 6, 345, 864, 5345, 4562, 54, 5, 452, 54, 45, 54, 45,
              5675676, 2, 3, 4, 6, 78, 80, 5, 6, 8, 45, 6, 45, 6, 345, 864,
              5345, 4562, 54, 5, 452, 54, 45, 54, 45, 65756, 1, 2, 3, 4, 6, 78,
              80, 5, 6, 8, 45, 6, 45, 6, 345, 864, 5345, 4562, 54, 5, 452, 54,
              45, 54, 45, 6587, 2, 3, 4, 6, 78, 80, 5, 6, 8, 45, 6, 45, 6, 345,
              864, 5345, 4562, 54, 5, 452, 54, 45, 54, 45, 5675676, 2, 3, 4, 6,
              78, 80, 5, 6, 8, 45, 6, 45, 6, 345, 864, 5345, 4562, 54, 5, 452,
              54, 45, 54, 45, 65756, 1, 2, 3, 4, 6, 78, 80, 5, 6, 8, 45, 6, 45,
              6, 345, 864, 5345, 4562, 54, 5, 452, 54, 45, 54, 45, 6587, 2, 3,
              4, 6, 78, 80, 5, 6, 8, 45, 6, 45, 6, 345, 864, 5345, 4562, 54, 5,
              452, 54, 45, 54, 45, 5675676, 2, 3, 4, 6, 78, 80, 5, 6, 8, 45, 6,
              45, 6, 345, 864, 5345, 4562, 54, 5, 452, 54, 45, 54, 45, 65756,
            ]}
          >
            {(item, index) => (
              <Box>
                {index} {item}
              </Box>
            )}
          </For>
        </div>
      </VanishingScroll>
    </div>
  );
};

export default HomePage;
