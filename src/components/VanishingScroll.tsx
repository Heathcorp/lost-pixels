import { Component, JSX, children } from "solid-js";

import styles from "./vanishingScroll.module.css";

const VanishingScroll: Component<{
  children?: JSX.Element;
  style?: JSX.CSSProperties;
}> = (props) => {
  return (
    <div class={styles.container} style={props.style}>
      {props.children}
    </div>
  );
};

export default VanishingScroll;
