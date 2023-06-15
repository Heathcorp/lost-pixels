import { Component, createSignal, onCleanup } from 'solid-js';
import type { JSX } from 'solid-js';
import Text from './Text';

const FONTS = ['Arvo'];

const LogoType: Component = () => {
  const [font, setFont] = createSignal<string>('Arvo');

  // const timer = setInterval(() =>{
  //   const index = Math.floor(FONTS.length * Math.random());
  //   setFont(FONTS[index]);
  // }, 100);

  // onCleanup(() => clearInterval(timer));

  return (
    <Text
      value="lostpixels.org"
      class="title"
      style={{ 'font-family': font() }}
    />
  );
};

export default LogoType;
