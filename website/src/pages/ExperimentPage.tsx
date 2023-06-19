import { Component } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';

import './pages.css';
import LogoType from '../components/LogoType';
import Box from '../components/Box';
import FlexDivider from '../components/FlexDivider';
import Text from '../components/Text';

const ExperimentPage: Component = (props) => {
  const params = useParams<{ experimentId: string }>();
  const navigate = useNavigate();

  if (!params.experimentId) navigate('/home');

  return (
    <div class="pageContainer">
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
      </div>
      <div>content</div>
    </div>
  );
};

export default ExperimentPage;
