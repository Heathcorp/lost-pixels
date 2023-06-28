import { Component } from 'solid-js';

import './components.css';

const TheButton: Component = (props) => {
  return (
    <div
      class="theButton"
      onClick={() => {
        console.log('button pressed');
      }}
    >
      press
    </div>
  );
};

export default TheButton;
