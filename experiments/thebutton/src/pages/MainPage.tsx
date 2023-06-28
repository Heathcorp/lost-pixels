import { Component } from 'solid-js';

import LogoType from '../components/LogoType';

import './pages.css';
import TheButton from '../components/TheButton';

const MainPage: Component = (props) => {
  return (
    <div class="pageContainer">
      <div
        class="contentContainer"
        style={{
          'flex-direction': 'column',
          'align-items': 'stretch',
          gap: '2rem',
        }}
      >
        <LogoType />
        <div style={{ 'flex-direction': 'column', padding: '2rem' }}>
          <TheButton />
        </div>
      </div>
    </div>
  );
};

export default MainPage;
