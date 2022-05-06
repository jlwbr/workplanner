import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { createContext, ReactNode, useMemo, useState } from 'react';
import { ReactQueryDevtools } from 'react-query/devtools';
import DateHeader from './DateHeader';
import Header from './Header';

type AdminLayoutProps = {
  children: ReactNode;
  hasDate?: boolean;
};

export const AdminDateContext = createContext(
  new Date(new Date().setHours(0, 0, 0, 0)),
);

export const AdminLayout = ({ children, hasDate }: AdminLayoutProps) => {
  const { data, status } = useSession();
  const [value, setValue] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
  const { value: date, setValue: setDate } = useMemo(
    () => ({
      value,
      setValue,
    }),
    [value],
  );

  // TODO: Make better error page
  if (status != 'authenticated') {
    return <p>NOT AUTHENTICATED</p>;
  }

  if (data && data.user && !data.user.isEditor) {
    return <p>UNAUTHORIZED</p>;
  }

  return (
    <>
      <Head>
        <title>Workplanner</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="min-h-screen bg-slate-100">
          {hasDate ? <DateHeader date={date} setDate={setDate} /> : <Header />}
          <div className="flex md:hidden items-center justify-center w-full h-full">
            <h1 className="text-center text-2xl text-slate-200">
              Deze pagina werk niet op een mobiele telefoon
            </h1>
          </div>
          <div className="hidden md:flex gap-4 mr-4">
            <Sidebar />
            <div className="container mx-auto px-1 py-4">
              <AdminDateContext.Provider value={date}>
                {children}
              </AdminDateContext.Provider>
            </div>
          </div>
        </div>
      </main>

      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
};

const menuItems = [
  {
    name: 'Dagverdeling',
    location: '/admin',
    Icon: () => (
      <svg
        className="w-6 h-6 text-gray-500 transition duration-75  group-hover:text-gray-900"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
      </svg>
    ),
  },
  {
    name: 'Taken',
    location: '/admin/tasks',
    Icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-gray-500 transition duration-75  group-hover:text-gray-900"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

const Sidebar = () => (
  <aside className="w-64" aria-label="Sidebar">
    <div className="overflow-y-auto h-[90vh] py-4 px-3 bg-white">
      <ul className="space-y-2">
        {menuItems.map(({ name, location, Icon }, i) => (
          <li key={i}>
            <Link href={location}>
              <a className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg  hover:bg-gray-100">
                <Icon />
                <span className="ml-3">{name}</span>
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </aside>
);
