import { Component, JSX, createContext } from 'solid-js';

import { FirebaseApp, initializeApp } from 'firebase/app';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

export const FirebaseAppContext = createContext<FirebaseApp>();

const firebaseConfig = {
  apiKey: 'AIzaSyBY4ZT_aaND_o9raipGJ7n9ujiPYvWm3UU',
  authDomain: 'lost-pixels-prod.firebaseapp.com',
  databaseURL: 'https://lost-pixels-prod-default-rtdb.firebaseio.com',
  projectId: 'lost-pixels-prod',
  storageBucket: 'lost-pixels-prod.appspot.com',
  messagingSenderId: '967442409576',
  appId: '1:967442409576:web:0bea28ffa49cf05f85f3dd',
  measurementId: 'G-HVBJSF85K0',
};

const FirebaseAppProvider: Component<{ children: JSX.Element }> = (props) => {
  const app = initializeApp(firebaseConfig);

  // emulator stuff
  // const functions = getFunctions(app);
  // connectFunctionsEmulator(functions, 'localhost', 5001);

  return (
    <FirebaseAppContext.Provider value={app}>
      {props.children}
    </FirebaseAppContext.Provider>
  );
};

export default FirebaseAppProvider;
