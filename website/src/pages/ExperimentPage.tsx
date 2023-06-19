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
      <div style={{ padding: '0.25rem' }}>
        <Box style={{ padding: '1rem' }}>
          <Box class="box-1 no-shadow no-padding">
            <iframe
              src="localhost:3000/home"
              style={{
                position: 'relative',
                width: '100%',
                height: '500px',
                margin: '0px',
                border: 'none',
              }}
            />
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default ExperimentPage;
