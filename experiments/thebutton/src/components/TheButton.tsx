import { Component, JSX } from 'solid-js';

import './components.css';
import './common.css';

const TheButton: Component<{ onClick?: () => void }> = (props) => {
  return (
    <div class="theButton noselect" onClick={props.onClick}>
      PRESS HERE
    </div>
  );
};

export default TheButton;
