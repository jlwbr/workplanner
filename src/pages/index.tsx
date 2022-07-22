import { useSession } from 'next-auth/react';
import { ReactElement, useContext, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import toast from 'react-hot-toast';
import {
  HiChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiPlus,
} from 'react-icons/hi';
import AsigneeBadge from '~/components/AsigneeBadge';
import { DateContext, DateLayout } from '~/components/DateLayout';
import KanbanComponent from '~/components/KanbanComponent';
import { trpc } from '~/utils/trpc';
import { NextPageWithLayout } from './_app';

const IndexPage: NextPageWithLayout = () => {
  const date = useContext(DateContext);
  const { data } = useSession();
  const userQuery = trpc.useQuery(['user.all']);
  const scheduleQuery = trpc.useQuery(['schedule.getAll', { date: date }]);
  const addUserMutation = trpc.useMutation(['user.add']);
  const planing = trpc.useQuery([
    'planning.byDate',
    {
      date,
    },
  ]);
  const [open, setOpen] = useState(false);

  const isLocked = planing.data?.every(({ locked }) => locked == true) ?? false;

  const addUser = () => {
    const name = prompt('Naam');

    if (!name) return;

    toast.promise(
      addUserMutation.mutateAsync({
        name,
      }),
      {
        loading: 'Gebruiker aan het toevoegen',
        error: 'Er is iets fout gegaan',
        success: 'Gebruiker is toegevoegd',
      },
    );
  };

  const users = userQuery.data || [];
  const schedule = scheduleQuery.data || [];

  const options =
    schedule && schedule.length > 0
      ? schedule.map((user) => ({
          value: user.userId,
          label: `${
            user.user?.name || `Anoniem (${user.userId.slice(0, 4)})`
          } (${user.schedule})`,
        }))
      : users.map((user) => ({
          value: user.id,
          label: user.name || `Anoniem (${user.id.slice(0, 4)})`,
        }));

  const excess =
    schedule &&
    schedule.length > 0 &&
    users
      .filter((user) => !schedule.find((s) => s.userId === user.id))
      .map((user) => ({
        value: user.id,
        label: user.name || `Anoniem (${user.id.slice(0, 4)})`,
      }));

  const morning = new Set<string>();
  const afternoon = new Set<string>();
  const evening = new Set<string>();

  planing.data?.forEach((item) => {
    item.PlanningItem.forEach((item) => {
      item.morningAsignee.forEach(({ id }) => {
        morning.add(id);
      });

      item.afternoonAsignee.forEach(({ id }) => {
        afternoon.add(id);
      });

      item.eveningAsignee.forEach(({ id }) => {
        evening.add(id);
      });
    });
  });

  const userAmount = (userId: string) => {
    let amount = 0;

    if (morning.has(userId)) amount++;
    if (afternoon.has(userId)) amount++;
    if (evening.has(userId)) amount++;

    return amount;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {data?.user?.isEditor && !isLocked && (
        <div className="hidden md:block sticky top-0 bg-slate-100">
          <div className="flex flex-wrap gap-2 p-5">
            {options.map((option) => (
              <AsigneeBadge
                key={option.value}
                canRemove={false}
                name={option.label}
                asigneeId={option.value}
                draggable={true}
                used={userAmount(option.value)}
              />
            ))}
            {excess &&
              open &&
              excess.map((option) => (
                <AsigneeBadge
                  key={option.value}
                  canRemove={false}
                  name={option.label}
                  asigneeId={option.value}
                  draggable={true}
                  used={userAmount(option.value)}
                />
              ))}
            {excess && (
              <button
                onClick={() => setOpen(!open)}
                className="text-xs inline-flex items-center font-bold leading-sm px-3 py-1 bg-gray-200 text-gray-700 rounded-full whitespace-nowrap"
              >
                {open ? (
                  <HiChevronDoubleLeft className="h-4 w-4" />
                ) : (
                  <HiOutlineChevronDoubleRight className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              onClick={() => addUser()}
              className="text-xs inline-flex items-center font-bold leading-sm px-3 py-1 bg-gray-200 text-gray-700 rounded-full whitespace-nowrap"
            >
              <HiPlus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <div className={'pt-5'}>
        <KanbanComponent
          date={date}
          isAdmin={data?.user?.isAdmin || false}
          isEditor={data?.user?.isEditor || data?.user?.isShared || false}
        />
      </div>
    </DndProvider>
  );
};

IndexPage.getLayout = (page: ReactElement) => <DateLayout>{page}</DateLayout>;
IndexPage.requireAuth = true;

export default IndexPage;

/**
 * If you want to statically render this page
 * - Export `appRouter` & `createContext` from [trpc].ts
 * - Make the `opts` object optional on `createContext()`
 *
 * @link https://trpc.io/docs/ssg
 */
// export const getStaticProps = async (
//   context: GetStaticPropsContext<{ filter: string }>,
// ) => {
//   const ssg = createSSGHelpers({
//     router: appRouter,
//     ctx: await createContext(),
//   });
//
//   await ssg.fetchQuery('post.all');
//
//   return {
//     props: {
//       trpcState: ssg.dehydrate(),
//       filter: context.params?.filter ?? 'all',
//     },
//     revalidate: 1,
//   };
// };
