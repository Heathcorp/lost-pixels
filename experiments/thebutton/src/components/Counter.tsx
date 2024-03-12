import { Component, Match, Show, Switch } from 'solid-js';

import './components.css';

const Counter: Component<{
  count: number;
  loadingStatus: 'LOADED' | 'LOADING' | 'REFETCHING';
}> = (props) => {
  return (
    <div class="counter">
      <Switch>
        <Match when={props.loadingStatus === 'LOADED'}>{props.count}</Match>
        <Match when={props.loadingStatus === 'REFETCHING'}>
          {'~'}
          {props.count}
        </Match>
        <Match when={props.loadingStatus === 'LOADING'}>{'Loading...'}</Match>
      </Switch>
    </div>
  );
};

export default Counter;
