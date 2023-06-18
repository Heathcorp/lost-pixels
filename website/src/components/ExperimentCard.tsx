import { Component, JSX, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';

import Text from '../components/Text';
import Box from '../components/Box';

const ExperimentCard: Component = () => {
  const navigate = useNavigate();

  return (
    <Box
      class="button-0"
      style={{
        display: 'flex',
        'flex-direction': 'column',
        'justify-content': 'flex-start',
        'align-items': 'stretch',
        padding: '1rem',
        gap: '0.5rem',
      }}
      onClick={() => navigate(`experiment/${'thebutton'}`)}
    >
      {/* Title */}
      <Text value="The Button" class="heading-1" />
      {/* Thumbnail */}
      <Box class="box-1 no-shadow square" style={{ padding: '0px' }}>
        <img
          src="https://meshgradient.com/gallery/9.png"
          class="image-default"
        />
      </Box>
      {/* Buttons? */}
      {/* Description */}
      <Text>Have you pressed the button?</Text>
    </Box>
  );
};

export default ExperimentCard;
