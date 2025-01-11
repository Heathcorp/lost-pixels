import { Component, mergeProps, JSX } from "solid-js";

import "./common.css";

const Box: Component<{
  children?: JSX.Element;
  class?: string;
  style?: JSX.CSSProperties;
  onClick?: () => void;
}> = (props) => {
  const defaults = { class: "box-0" };
  const merged = mergeProps(defaults, props);

  return (
    <div
      classList={{
        [defaults.class]: true,
        [merged.class]: true,
      }}
      style={props.style}
      // TODO: understand reactivity:
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
};

export default Box;
