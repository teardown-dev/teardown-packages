import React, {FunctionComponent, PropsWithChildren, useEffect} from 'react';
import {TeardownContainer} from './packages/react-native';
import {teardownClient} from './teardown.client.ts';

export type MainProps = PropsWithChildren<{}>;

export const Main: FunctionComponent<MainProps> = props => {
  const {} = props;
  //
  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     console.log('Hello World', new Date(), {
  //       testObj: true,
  //     });
  //
  //     const fetchTodos = async () => {
  //       const rsp = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  //       const json = await rsp.json();
  //       console.log('json', json);
  //     };
  //
  //     void fetchTodos();
  //   }, 5000);
  //
  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, []);

  return (
    <TeardownContainer client={teardownClient}>
      <></>
    </TeardownContainer>
  );
};
