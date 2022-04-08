import { ReactElement } from 'react';
import { DateLayout } from '~/components/DateLayout';
import Planning from '~/components/Planning';
import { NextPageWithLayout } from './_app';

const PlanningPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-row w-full gap-4">
      <div className="basis-full rounded-lg shadow-lg bg-white">
        <Planning />
      </div>
      <div className="basis-1/4 rounded-lg shadow-lg bg-white hidden md:block">
        <div className="p-4">
          <p>Hoi</p>
        </div>
      </div>
    </div>
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
