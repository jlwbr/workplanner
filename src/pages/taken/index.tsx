import { ReactElement } from 'react';
import { DateLayout } from '~/components/DateLayout';
import TaskList from '~/components/TaskList';
import { trpc } from '../../utils/trpc';
import { NextPageWithLayout } from '../_app';

const PlanningPage: NextPageWithLayout = () => {
  const todoCategoryQuery = trpc.useQuery(['todoCategory.all']);

  if (!todoCategoryQuery.isSuccess) return null;

  return (
    <>
      <div className="flex flex-col w-full gap-2">
        {todoCategoryQuery.data.map(({ id, name }) => (
          <div key={id}>
            <div className="basis-full flex justify-between px-4 pt-2">
              <h2 className="text-lg">{name}</h2>
            </div>

            <div className="basis-full rounded-lg shadow-lg bg-white">
              <TaskList Category={id} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

PlanningPage.getLayout = (page: ReactElement) => (
  <DateLayout>{page}</DateLayout>
);

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
