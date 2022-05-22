import { useSession } from 'next-auth/react';
import { ReactElement, useContext } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DateContext, DateLayout } from '~/components/DateLayout';
import KanbanComponent from '~/components/KanbanComponent';
import { NextPageWithLayout } from './_app';

const IndexPage: NextPageWithLayout = () => {
  const date = useContext(DateContext);
  const { data } = useSession();
  return (
    <DndProvider backend={HTML5Backend}>
      <KanbanComponent date={date} isAdmin={data?.user?.isShared || false} />
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
