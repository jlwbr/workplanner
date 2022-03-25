import Link from 'next/link';
import Planning from '~/components/Planning';
import { trpc } from '../utils/trpc';
import { NextPageWithLayout } from './_app';

const PlanningPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-row w-full gap-4">
      <div className="basis-full rounded-lg shadow-lg bg-white">
        <Planning />
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
