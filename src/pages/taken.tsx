import Link from 'next/link';
import TaskList from '~/components/TaskList';
import { trpc } from '../utils/trpc';
import { NextPageWithLayout } from './_app';

const PlanningPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col w-full gap-2">
      <div className="basis-full">
        <h2 className="text-lg px-4 pt-2">Buitenterrein / Tochtsluis</h2>
      </div>
      <div className="basis-full rounded-lg shadow-lg bg-white">
        <TaskList />
      </div>
      <div className="basis-full">
        <h2 className="text-lg px-4 pt-2">Hallo</h2>
      </div>
      <div className="basis-full rounded-lg shadow-lg bg-white">
        <TaskList />
      </div>
      <div className="basis-full">
        <h2 className="text-lg px-4 pt-2">Hallo</h2>
      </div>
      <div className="basis-full rounded-lg shadow-lg bg-white">
        <TaskList />
      </div>
    </div>
  );
};

export default PlanningPage;

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
