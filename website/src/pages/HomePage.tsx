import { Component, For, JSX } from 'solid-js';

import Text from '../components/Text';
import LogoType from '../components/LogoType';
import Box from '../components/Box';

import './pages.css';
import FlexDivider from '../components/FlexDivider';
import ExperimentCard from '../components/ExperimentCard';
import { EXPERIMENTS_LIST } from '../constants';
import { useNavigate } from '@solidjs/router';

const HomePage: Component = () => {
  const navigate = useNavigate();
  return (
    <div class="pageContainer">
      {/* Header bar */}
      <div class="pageRowContainer">
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
          <Text
            class="clickable heading-1"
            value="About"
            onClick={() => navigate('/about')}
          />
          <FlexDivider />
          <Text class="clickable disabled heading-1" value="Random" />
          <FlexDivider />
          <Text class="clickable disabled heading-1" value="Search" />
        </Box>
      </div>
      {/* Content */}
      <div class="homePageContentContainer">
        <For each={EXPERIMENTS_LIST}>
          {(item) => <ExperimentCard {...item} />}
        </For>
      </div>
    </div>
  );
};

export default HomePage;
