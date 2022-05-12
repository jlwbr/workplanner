import Head from 'next/head';
import { createContext, ReactNode, useMemo, useState } from 'react';
import { ReactQueryDevtools } from 'react-query/devtools';
import DateHeader from './DateHeader';

type DefaultLayoutProps = { children: ReactNode };

export const DateContext = createContext(
  new Date(new Date().setHours(0, 0, 0, 0)),
);

export const DateLayout = ({ children }: DefaultLayoutProps) => {
  const [value, setValue] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
  const { value: date, setValue: setDate } = useMemo(
    () => ({
      value,
      setValue,
    }),
    [value],
  );

  return (
    <>
      <Head>
        <title>Workplanner</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="min-h-screen bg-slate-100">
          <DateHeader date={date} setDate={setDate} />
          <div className="pt-4">
            <DateContext.Provider value={date}>{children}</DateContext.Provider>
          </div>
        </div>
      </main>

      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
};
