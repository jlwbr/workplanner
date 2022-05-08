import { signOut, useSession } from 'next-auth/react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { classNames } from './DateHeader';
import { trpc } from '~/utils/trpc';
import Link from 'next/link';

function MyLink(props: any) {
  const { href, children, ...rest } = props;
  return (
    <Link href={href}>
      <a {...rest}>{children}</a>
    </Link>
  );
}

export const UserMenu = ({ image }: { image: string }) => {
  const { data } = useSession();
  const syncChannels = trpc.useMutation(['slack.syncChannels']);
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div className="mr-6">
        <Menu.Button>
          <img
            className="inline object-cover w-8 h-8 rounded-full shadow-md hover:ring"
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
        <Menu.Items className="origin-top-right z-10 absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {data?.user?.isAdmin && (
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="#"
                    onClick={() => syncChannels.mutateAsync()}
                    className={classNames(
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      'block px-4 py-2 text-sm',
                    )}
                  >
                    Sync rollen
                  </a>
                )}
              </Menu.Item>
            )}
            {data?.user?.isEditor && (
              <Menu.Item>
                {({ active }) => (
                  <MyLink
                    href="/admin"
                    className={classNames(
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      'block px-4 py-2 text-sm',
                    )}
                  >
                    Admin
                  </MyLink>
                )}
              </Menu.Item>
            )}
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
