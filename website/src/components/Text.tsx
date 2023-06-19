import { Component, mergeProps, JSX } from 'solid-js';

import './common.css';

const Text: Component<{
  value?: string;
  children?: JSX.Element;
  class?: string;
  classList?: { [x: string]: boolean };
  style?: JSX.CSSProperties;
  disabled?: boolean;
  onClick?: () => void;
}> = (props) => {
  const defaults = { class: 'default_text' };
  const merged = mergeProps(defaults, props);

  return (
    <p
      classList={{
        [defaults.class]: true,
        [merged.class]: true,
        ...props.classList,
      }}
      style={props.style}
      // disabled={props.disabled}
      onClick={() => props.onClick?.()}
    >
      {props.value}
      {props.children}
    </p>
  );
};

export default Text;
