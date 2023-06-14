import type { Component } from 'solid-js';
import type { JSX } from 'solid-js';

import { mergeProps } from 'solid-js';

import './common.css';

const Text: Component<{value?: string; children?: JSX.Element; class?: string; style?: JSX.CSSProperties}> = (props) => {
  const merged = mergeProps({class: "default_text"}, props);
  return (
    <p classList={{default_text: true, [merged.class]: true}} style={props.style}>
      {props.value}
      {props.children}
    </p>
  );
}

export default Text;
