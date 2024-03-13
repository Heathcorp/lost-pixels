import { Component, JSX } from 'solid-js';

import './components.css';
import './common.css';

const TheButton: Component<{ onClick?: () => void; enabled?: boolean }> = (
  props
) => {
  return (
    <div
      class="theButton noselect"
      classList={{ 'theButton-disabled': !(props.enabled ?? true) }}
      onClick={() => props.onClick?.()}
    >
      PRESS HERE
    </div>
  );
};

export default TheButton;
