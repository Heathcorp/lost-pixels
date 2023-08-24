import {
  Component,
  createSignal,
  useContext,
  createEffect,
  createResource,
  onCleanup,
} from 'solid-js';

import LogoType from '../components/LogoType';

import './pages.css';
import TheButton from '../components/TheButton';
import Counter from '../components/Counter';

import { FirebaseAppContext } from '../contexts/FirebaseAppProvider';
import { getFunctions, httpsCallable } from 'firebase/functions';

const SPOOLING_TIMEOUT = 10000;
const INACTIVE_TIMEOUT = 60000;
const REFETCH_INTERVAL = 5000;

const MainPage: Component = (props) => {
  // firebase initialisation
  const firebaseApp = useContext(FirebaseAppContext);
  const functions = getFunctions(firebaseApp);
  const getButtonCountFunction = httpsCallable<
    unknown,
    { success: boolean; count?: number; reason?: string }
  >(functions, 'buttonCount');
  const pressButtonFunction = httpsCallable<
    { count?: number },
    { success: boolean; reason?: string }
  >(functions, 'buttonPressed');

  // get the button count/store the button count
  const [count, { mutate: setCount, refetch }] = createResource<number>(
    async (source, { value, refetching }) => {
      const resp = await getButtonCountFunction({});
      console.log(resp.data);
      if (!resp.data.success) {
        throw new Error('get button count failed');
      }
      return resp.data.count ?? value ?? 0;
    },
    { initialValue: 0 }
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
    pressButtonFunction({ count: cachedSpooledPresses })
      .then((value) => {
        console.log(value);
        if (!value.data.success) {
          revert();
        }
      })
      .catch((reason) => {
        console.error(reason);
        console.log('fail', reason);
        revert();
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
  createEffect(() => {
    console.log('spooled:', spooledPresses());

    if (!spooledPresses()) return;

    // delay/make the spooling timeout
    if (spoolingTimeoutId !== null) clearTimeout(spoolingTimeoutId);
    spoolingTimeoutId = setTimeout(sendSpooledPresses, SPOOLING_TIMEOUT);

    // same-ish deal with inactivity
    if (inactiveTimeoutId !== null) {
      clearTimeout(inactiveTimeoutId);
    } else {
      setActive(true);
    }
    inactiveTimeoutId = setTimeout(() => setActive(false), INACTIVE_TIMEOUT);
  });

  let refetchIntervalId: NodeJS.Timer | null = setInterval(
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
    }
  });

  createEffect(() => {
    console.log('main count:', count());
  });

  return (
    <div class="pageContainer">
      <div class="contentContainer">
        <LogoType />
        {/* Stats */}
        <Counter count={count() + spooledPresses()} />
        <div style={{ 'flex-direction': 'column', padding: '1rem' }}>
          <TheButton
            onClick={() => setSpooledPresses((prevSpooled) => prevSpooled + 1)}
          />
        </div>
      </div>
    </div>
  );
};

export default MainPage;
