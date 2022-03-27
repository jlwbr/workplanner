import Head from 'next/head';
import { createContext, ReactNode, useState } from 'react';
import { ReactQueryDevtools } from 'react-query/devtools';
import DateHeader from './DateHeader';

type DefaultLayoutProps = { children: ReactNode };

export const DateContext = createContext(new Date());

export const DateLayout = ({ children }: DefaultLayoutProps) => {
  const [date, setDate] = useState(new Date());
  return (
    <>
      <Head>
        <title>Workplanner</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="min-h-screen bg-slate-100">
          <DateHeader date={date} setDate={setDate} />
          <div className="container mx-auto px-1 py-4">
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
