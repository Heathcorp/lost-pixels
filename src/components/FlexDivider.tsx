import { Component, JSX, mergeProps } from 'solid-js';

import './flexDivider.css';

const FlexDivider: Component<{ type?: number; style?: JSX.CSSProperties }> = (
  props
) => {
  const defaults = { type: 0 };
  const merged = mergeProps(defaults, props);
  return (
    <div
      class={`flexDivider flexDivider-${merged.type}`}
      style={merged.style}
    />
  );
};

export default FlexDivider;
