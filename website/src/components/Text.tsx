import { Component, mergeProps, JSX } from 'solid-js';

import './common.css';

const Text: Component<{
  value?: string;
  children?: JSX.Element;
  class?: string;
  style?: JSX.CSSProperties;
}> = (props) => {
  const defaults = { class: 'default_text' };
  const merged = mergeProps(defaults, props);

  return (
    <p
      classList={{ [defaults.class]: true, [merged.class]: true }}
      style={props.style}
    >
      {props.value}
      {props.children}
    </p>
  );
};

export default Text;
