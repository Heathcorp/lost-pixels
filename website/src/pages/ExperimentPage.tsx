import { Component } from 'solid-js';
import { useParams, useNavigate, useRouteData } from '@solidjs/router';

import type { ExperimentData } from '../constants';

import './pages.css';
import LogoType from '../components/LogoType';
import Box from '../components/Box';

const ExperimentPage: Component = () => {
  const navigate = useNavigate();
  const data = useRouteData<ExperimentData>();

  const goHome = () => navigate('/home');

  if (!data) goHome();

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
        <Box class="box-0">
          <LogoType class="clickable" onClick={goHome} />
        </Box>
      </div>
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          'justify-content': 'flex-start',
          'align-items': 'stretch',
          padding: '0.25rem',
          flex: 1,
        }}
      >
        <Box style={{ padding: '1rem', flex: 1 }}>
          <Box class="box-1 no-shadow no-padding" style={{ flex: 1 }}>
            <iframe
              src={data.url}
              style={{
                display: 'block',
                position: 'relative',
                margin: '0px',
                border: 'none',
                flex: 1,
              }}
            />
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default ExperimentPage;
