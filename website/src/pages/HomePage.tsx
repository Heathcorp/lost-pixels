import { Component, For, JSX } from 'solid-js';

import Text from '../components/Text';
import LogoType from '../components/LogoType';
import Box from '../components/Box';

import './pages.css';
import FlexDivider from '../components/FlexDivider';
import ExperimentCard from '../components/ExperimentCard';

const EXPERIMENTS_LIST: {
  id: string;
  name: string;
  caption: string;
  url: string;
  image_path: string;
}[] = [
  {
    id: 'thebutton',
    name: 'The Button',
    caption: 'Have you pressed the button?',
    url: 'thebutton.lostpixels.org',
    image_path: 'https://meshgradient.com/gallery/9.png',
  },
];

const HomePage: Component = () => {
  return (
    <div
      class="pageContainer"
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
