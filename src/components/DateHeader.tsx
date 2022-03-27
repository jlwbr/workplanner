import { signIn, signOut, useSession } from 'next-auth/react';
import { Menu, Transition } from '@headlessui/react';
import { Dispatch, Fragment, SetStateAction } from 'react';
import Link from 'next/link';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type DateHeaderType = {
  date: Date;
  setDate: Dispatch<SetStateAction<Date>>;
};

function addDays(dateTime: Date, count_days = 0) {
  return new Date(new Date(dateTime).setDate(dateTime.getDate() + count_days));
}

const DateHeader = ({ date, setDate }: DateHeaderType) => {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between flex-wrap p-4 shadow-md bg-white">
      <div className="flex items-center flex-shrink-0 mr-6">
        <Link href="/">
          <a href="#" className="font-semibold text-xl tracking-tight">
            Workload Planner
          </a>
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setDate(addDays(date, -1))}
          className="inline-flex items-center justify-center w-10 h-10 mr-1 text-gray-700 transition-colors duration-150 bg-white rounded-full focus:shadow-outline hover:bg-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
            />
          </svg>
        </button>
        <h5 className="text-xl text-center">
          {new Date().toDateString() == date.toDateString()
            ? 'Vandaag'
            : date.toLocaleDateString()}
        </h5>
        <button
          onClick={() => setDate(addDays(date, 1))}
          className="inline-flex items-center justify-center w-10 h-10 ml-1 text-gray-700 transition-colors duration-150 bg-white rounded-full focus:shadow-outline hover:bg-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
            />
          </svg>
        </button>
      </div>
      <div>
        {(session && <UserMenu image={session.user?.image || ''} />) || (
          <button
            onClick={() => signIn('slack')}
            className="inline-flex items-center h-10 px-5 text-indigo-100 transition-colors duration-150 bg-indigo-700 rounded-lg focus:shadow-outline hover:bg-indigo-800"
          >
            <span>Inloggen met</span>
            <svg
              className="w-4 h-4 ml-3 fill-current"
              enableBackground="new 0 0 2447.6 2452.5"
              viewBox="0 0 2447.6 2452.5"
            >
              <g clipRule="evenodd" fillRule="evenodd">
                <path
                  d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z"
                  fill="#36c5f0"
                />
                <path
                  d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z"
                  fill="#2eb67d"
                />
                <path
                  d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z"
                  fill="#ecb22e"
                />
                <path
                  d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0"
                  fill="#e01e5a"
                />
              </g>
            </svg>
          </button>
        )}
      </div>
    </nav>
  );
};

const UserMenu = ({ image }: { image: string }) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button>
          <img
            className="inline object-cover w-8 h-8 mr-6 rounded-full shadow-md hover:ring"
            src={image}
            alt="Profile image"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  onClick={() => signOut()}
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block px-4 py-2 text-sm',
                  )}
                >
                  Uitloggen
                </a>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default DateHeader;
