import { Component, createSignal } from 'solid-js';

import LogoType from '../components/LogoType';

import './pages.css';
import TheButton from '../components/TheButton';
import Counter from '../components/Counter';

const MainPage: Component = (props) => {
  const [count, setCount] = createSignal(0);

  return (
    <div class="pageContainer">
      <div class="contentContainer">
        <LogoType />
        {/* Stats */}
        <Counter count={count()} />
        <div style={{ 'flex-direction': 'column', padding: '1rem' }}>
          <TheButton onClick={() => setCount((prev) => prev + 1)} />
        </div>
      </div>
    </div>
  );
};

export default MainPage;
