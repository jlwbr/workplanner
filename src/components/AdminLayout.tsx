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
  new Date(new Date().setUTCHours(0, 0, 0, 0)),
);

export const AdminLayout = ({ children, hasDate }: AdminLayoutProps) => {
  const { data, status } = useSession();
  const [value, setValue] = useState(
    new Date(new Date().setUTCHours(0, 0, 0, 0)),
  );
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
          <AdminDateContext.Provider value={date}>
            {hasDate ? (
              <DateHeader date={date} setDate={setDate} />
            ) : (
              <Header />
            )}
            <div className="flex gap-4 mr-4">
              <Sidebar />
              <div className="container mx-auto px-1 py-4">{children}</div>
            </div>
          </AdminDateContext.Provider>
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
  {
    name: 'Categorieën',
    location: '/admin/channels',
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
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    name: 'Standaarden',
    location: '/admin/defaults',
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
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    name: 'Importeer rooster',
    location: '/admin/import',
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
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    name: 'Authorisatie',
    location: '/admin/authorization',
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
          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
        />
      </svg>
    ),
  },
];

const Sidebar = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [open, setOpen] = useState(false);
  return (
    <aside aria-label="Sidebar">
      <div className="overflow-y-auto min-h-[90vh] h-full py-4 px-3 bg-white">
        <ul className="space-y-2">
          <li>
            <a
              onClick={() => setOpen(!open)}
              className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg  hover:bg-gray-100 cursor-pointer"
            >
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {open && <span className="ml-3 pr-5">Sluit menu</span>}
            </a>
          </li>
          {menuItems.map(({ name, location, Icon }, i) => (
            <li key={i}>
              <Link href={location}>
                <a className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg  hover:bg-gray-100 whitespace-nowrap">
                  <Icon />
                  {open && <span className="ml-3 pr-5">{name}</span>}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
