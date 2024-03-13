import { Component, Match, Show, Switch } from 'solid-js';

import './components.css';

const Counter: Component<{
  count: number;
  loadingStatus: 'LOADED' | 'LOADING' | 'REFETCHING' | 'ERROR' | 'UPLOADING';
  frozen: boolean;
}> = (props) => {
  return (
    <div class="counter" classList={{ 'counter-frozen': props.frozen }}>
      <Switch>
        <Match when={props.frozen}>
          {'['}
          {props.count}
          {']'}
        </Match>
        <Match when={props.loadingStatus === 'LOADED'}>{props.count}</Match>
        <Match
          when={
            props.loadingStatus === 'REFETCHING' ||
            props.loadingStatus === 'UPLOADING'
          }
        >
          {'~'}
          {props.count}
        </Match>
        <Match when={props.loadingStatus === 'LOADING'}>{'Loading...'}</Match>
        <Match when={props.loadingStatus === 'ERROR'}>{'Error!'}</Match>
      </Switch>
    </div>
  );
};

export default Counter;
