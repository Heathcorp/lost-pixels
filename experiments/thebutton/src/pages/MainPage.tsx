import {
  Component,
  createSignal,
  useContext,
  createEffect,
  createResource,
  onCleanup,
  on,
  Show,
} from 'solid-js';

import LogoType from '../components/LogoType';

import './pages.css';
import TheButton from '../components/TheButton';
import Counter from '../components/Counter';

import { FirebaseAppContext } from '../contexts/FirebaseAppProvider';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Turnstile } from '@nerimity/solid-turnstile';
import { makePersisted } from '@solid-primitives/storage';

const SPOOLING_TIMEOUT = 1000;
const INACTIVE_TIMEOUT = 30000;
const REFETCH_INTERVAL = 3000;

const MainPage: Component = (props) => {
  // firebase initialisation
  const firebaseApp = useContext(FirebaseAppContext);
  const functions = getFunctions(firebaseApp);
  const getButtonCountFunction = httpsCallable<
    unknown,
    { success: boolean; count?: number; reason?: string; frozen?: boolean }
  >(functions, 'buttonCount');
  const pressButtonFunction = httpsCallable<
    { count?: number; turnstileToken: string },
    { success: boolean; reason?: string; frozen?: boolean }
  >(functions, 'buttonPressed');

  // get the button count/store the button count
  const [loadingStatus, setLoadingStatus] = createSignal<
    'LOADED' | 'LOADING' | 'REFETCHING' | 'ERROR' | 'UPLOADING'
  >('LOADING');
  const [countFrozenGlobally, setCountFrozenGlobally] = createSignal(false);
  const [count, { mutate: setCount, refetch }] = createResource<number>(
    (source, { value, refetching }) => {
      if (refetching) {
        console.log('REFETCHING');
        setLoadingStatus('REFETCHING');
      } else {
        console.log('FIRST LOAD');
        setLoadingStatus('LOADING');
      }
      let fail: ErrorOptions | undefined | string = undefined;
      return new Promise((resolve, reject) => {
        getButtonCountFunction({})
          .then((resp) => {
            console.log(resp.data);
            if (!resp.data.success) {
              fail = resp.data.reason;
            }
            setLoadingStatus('LOADED');
            resolve(resp.data.count ?? value ?? 0);
            if (resp.data.frozen) {
              setCountFrozenGlobally(true);
            }
          })
          .catch((err) => {
            fail = err;
          })
          .finally(() => {
            if (fail) {
              setLoadingStatus('ERROR');
              console.error(fail);
              reject(
                new Error('get button count failed:' + JSON.stringify(fail))
              );
            }
          });
      });
    },
    { initialValue: 0, storage: () => makePersisted(createSignal()) }
  );

  const [spooledPresses, setSpooledPresses] = createSignal(0);
  const [active, setActive] = createSignal(true);

  const sendSpooledPresses = () => {
    const cachedSpooledPresses = spooledPresses();
    setSpooledPresses(0);
    setCount((prevCount) => prevCount + cachedSpooledPresses);
    const revert = () => {
      setCount((prevCount) => prevCount - cachedSpooledPresses);
      setSpooledPresses((prevSpooled) => prevSpooled + cachedSpooledPresses);
    };
    let fail: string | undefined;
    let frozenReturned = false;
    setLoadingStatus('UPLOADING');
    pressButtonFunction({
      count: cachedSpooledPresses,
      turnstileToken: turnstileToken() ?? '',
    })
      .then((value) => {
        console.log(value);
        if (!value.data.success) {
          fail = value.data.reason;
        }
        if (value.data.frozen) {
          frozenReturned = true;
        }
      })
      .catch((reason) => {
        console.error(reason);
        console.log('fail', reason);
        fail = reason;
      })
      .finally(() => {
        if (fail) {
          setLoadingStatus('ERROR');
          revert();
        } else {
          setLoadingStatus('LOADED');
          refetchIntervalId = setInterval(refetch, REFETCH_INTERVAL);
        }
        if (frozenReturned) {
          console.log('COUNT FROZEN RETURNED');
          setCountFrozenGlobally(true);
          setSpooledPresses(0);
        }
      });
  };

  // make sure the spooled presses get to the server if tab is closed
  const onBeforeUnload = () => {
    sendSpooledPresses();
  };
  window.addEventListener('beforeunload', onBeforeUnload);
  // clean this up if this component unmounts
  onCleanup(() => window.removeEventListener('beforeunload', onBeforeUnload));

  let spoolingTimeoutId: NodeJS.Timeout | null = null;
  let inactiveTimeoutId: NodeJS.Timeout | null = setTimeout(
    () => setActive(false),
    INACTIVE_TIMEOUT
  );
  createEffect(
    on([spooledPresses], () => {
      if (!spooledPresses()) return;

      // delay/make the spooling timeout
      if (spoolingTimeoutId !== null) clearTimeout(spoolingTimeoutId);
      spoolingTimeoutId = setTimeout(sendSpooledPresses, SPOOLING_TIMEOUT);
      if (refetchIntervalId) {
        // refetch gets restarted after spooled presses get sent
        clearTimeout(refetchIntervalId);
        refetchIntervalId = null;
      }

      // same-ish deal with inactivity
      if (inactiveTimeoutId !== null) {
        clearTimeout(inactiveTimeoutId);
      } else {
        setActive(true);
      }
      inactiveTimeoutId = setTimeout(() => setActive(false), INACTIVE_TIMEOUT);
    })
  );

  let refetchIntervalId: NodeJS.Timeout | null = setInterval(
    refetch,
    REFETCH_INTERVAL
  );
  // if active create/leave existing interval
  // if not active clear existing interval to stop refetching
  createEffect(() => {
    if (active()) {
      refetchIntervalId =
        refetchIntervalId ?? setInterval(refetch, REFETCH_INTERVAL);
    } else if (refetchIntervalId !== null) {
      clearInterval(refetchIntervalId);
      refetchIntervalId = null;
    }
  });

  createEffect(() => {
    console.log('main count:', count());
  });

  const [turnstileToken, setTurnstileToken] = createSignal<string>();

  return (
    <div class="pageContainer">
      <div class="contentContainer">
        <LogoType />
        {/* Stats */}
        <Counter
          count={count() + spooledPresses()}
          loadingStatus={loadingStatus()}
          frozen={countFrozenGlobally()}
        />
        <div style={{ 'flex-direction': 'column', padding: '1rem' }}>
          <TheButton
            enabled={!countFrozenGlobally()}
            onClick={
              !countFrozenGlobally()
                ? () => setSpooledPresses((prevSpooled) => prevSpooled + 1)
                : undefined
            }
          />
        </div>
        <Show when={countFrozenGlobally()}>
          <div class="infoText">
            The Button has been frozen for maintenance. Please check back later.
          </div>
        </Show>
      </div>
      {/* TODO: PARAMETERIZE PROPERLY AND REFACTOR */}
      <Turnstile
        sitekey="0x4AAAAAAAUs_sZVsYShS916"
        onVerify={setTurnstileToken}
      />
    </div>
  );
};

export default MainPage;
