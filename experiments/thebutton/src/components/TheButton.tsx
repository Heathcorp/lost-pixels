import { Component, JSX } from 'solid-js';

import './components.css';

const TheButton: Component<{ onClick?: () => void }> = (props) => {
  return (
    <div class="theButton" onClick={props.onClick}>
      press
    </div>
  );
};

export default TheButton;
