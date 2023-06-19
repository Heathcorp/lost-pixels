import { Component, createSignal, mergeProps, onCleanup } from 'solid-js';
import Text from './Text';

const FONTS = ['Arvo', 'Verdana'];

const LogoType: Component<{ text?: string }> = (props) => {
  const defaults = { text: 'lostpixels.org' };
  const merged = mergeProps(defaults, props);
  const [font, setFont] = createSignal<string>(FONTS[0]);

  // const timer = setInterval(() =>{
  //   const index = Math.floor(FONTS.length * Math.random());
  //   setFont(FONTS[index]);
  // }, 100);

  // onCleanup(() => clearInterval(timer));

  return (
    <Text value={merged.text} class="title" style={{ 'font-family': font() }} />
  );
};

export default LogoType;
