import TaskList from '~/components/TaskList';
import { trpc } from '../../utils/trpc';
import { NextPageWithLayout } from '../_app';

const PlanningPage: NextPageWithLayout = () => {
  const utils = trpc.useContext();

  const todoCategoryQuery = trpc.useQuery(['todoCategory.all']);
  const todoCategoryMutationAdd = trpc.useMutation(['todoCategory.add'], {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['todoCategory.all']);
    },
  });

  const todoCategoryMutationDelete = trpc.useMutation(['todoCategory.delete'], {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['todoCategory.all']);
    },
  });

  const addCatogory = () => {
    const name = prompt('Categorienaam:', '');

    if (!name) return;

    todoCategoryMutationAdd.mutateAsync({ name });
  };

  if (!todoCategoryQuery.isSuccess) return null;

  return (
    <>
      <div className="flex flex-col w-full gap-2">
        {todoCategoryQuery.data.map(({ id, name }) => (
          <div key={id}>
            <div className="basis-full flex justify-between px-4 pt-2">
              <h2 className="text-lg">{name}</h2>
              <button
                onClick={() => todoCategoryMutationDelete.mutateAsync({ id })}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>

            <div className="basis-full rounded-lg shadow-lg bg-white">
              <TaskList Category={id} Editable={true} />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addCatogory}
        className="fixed right-2 bottom-2 w-12 h-12 bg-red-600 rounded-full hover:bg-red-700 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
      >
        <svg
          viewBox="0 0 20 20"
          enableBackground="new 0 0 20 20"
          className="w-6 h-6 inline-block"
        >
          <path
            fill="#FFFFFF"
            d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601
                                    C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399
                                    C15.952,9,16,9.447,16,10z"
          />
        </svg>
      </button>
    </>
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
