import { Component } from 'solid-js';

import './components.css';

const Counter: Component<{ count?: number }> = (props) => {
  return <div class="counter">{props.count}</div>;
};

export default Counter;
