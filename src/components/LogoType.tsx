import { Component, createSignal, mergeProps, onCleanup } from 'solid-js';
import Text from './Text';

const FONTS = ['Arvo', 'Verdana'];

const LogoType: Component<{
  text?: string;
  class?: string;
  onClick?: () => void;
}> = (props) => {
  const defaults = { text: 'lostpixels.org', class: 'title' };
  const merged = mergeProps(defaults, props);
  const [font, setFont] = createSignal<string>(FONTS[0]);

  // const timer = setInterval(() =>{
  //   const index = Math.floor(FONTS.length * Math.random());
  //   setFont(FONTS[index]);
  // }, 100);

  // onCleanup(() => clearInterval(timer));

  return (
    <Text
      value={merged.text}
      classList={{ [defaults.class]: true, [merged.class]: true }}
      style={{ 'font-family': font() }}
      onClick={props.onClick}
    />
  );
};

export default LogoType;
