import Link from 'next/link';
import { NextPageWithLayout } from './_app';

const IndexPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-row justify-center cneter w-full self-center gap-4">
      <Link href="/planning">
        <div className="rounded-lg shadow-lg bg-white text-center p-6 hover:cursor-pointer">
          <a>Planning</a>
        </div>
      </Link>
      <Link href="/taken">
        <div className="rounded-lg shadow-lg bg-white text-center p-6 hover:cursor-pointer">
          <a>Taken</a>
        </div>
      </Link>
    </div>
  );
};

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
