// import {TeardownContainer} from '@teardown/react-native';
import React, {FunctionComponent, PropsWithChildren} from 'react';
import {View} from 'react-native';
import './teardown.client';
// import {teardownClient} from './teardown.client';

export type MainProps = PropsWithChildren<{}>;

export const Main: FunctionComponent<MainProps> = props => {
  const {} = props;

  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     console.log('Hello World', new Date(), {
  //       testObj: true,
  //     });
  //
  //     const myHeaders = new Headers();
  //     myHeaders.append(
  //       'apikey',
  //       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY29nZnhhY3R6dmhsZHp1eGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDIyNjgwNzEsImV4cCI6MjAxNzg0NDA3MX0.2-nMK_XS-8PKSb0AixNS-8lToPB4d4mczFoeNWBln68',
  //     );
  //     myHeaders.append(
  //       'Authorization',
  //       'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY29nZnhhY3R6dmhsZHp1eGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDIyNjgwNzEsImV4cCI6MjAxNzg0NDA3MX0.2-nMK_XS-8PKSb0AixNS-8lToPB4d4mczFoeNWBln68',
  //     );
  //
  //     fetch(
  //       'https://rjcogfxactzvhldzuxfb.supabase.co/rest/v1/review?select=*',
  //       {
  //         method: 'GET',
  //         headers: myHeaders,
  //         redirect: 'follow',
  //       },
  //     )
  //       .then(response => response.text())
  //       .then(result => console.log(result))
  //       .catch(error => console.error(error));
  //   }, 1000);
  //
  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, []);

  return (
    <>
      {/*<TeardownContainer client={teardownClient}>*/}
      <View className={'flex-1 bg-orange-500'} />
      {/*</TeardownContainer>*/}
    </>
  );
};
