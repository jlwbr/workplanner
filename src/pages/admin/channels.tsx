import { ReactElement } from 'react';
import { AdminLayout } from '~/components/AdminLayout';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const IndexPage: NextPageWithLayout = () => {
  const context = trpc.useContext();
  const options = {
    onSuccess: () => {
      context.invalidateQueries(['planning.rules.all']);
      context.invalidateQueries(['channel.all']);
    },
  };
  const RulesQuery = trpc.useQuery(['channel.all']);
  const addChannel = trpc.useMutation(['channel.add'], options);
  const editChannel = trpc.useMutation(['channel.edit'], options);
  const deleteChannel = trpc.useMutation(['channel.remove'], options);
  const moveChannel = trpc.useMutation(['channel.move'], options);

  // FIXME: Better loading page
  if (!RulesQuery.isSuccess) return null;

  const data = RulesQuery.data;

  const onAdd = async () => {
    const name = prompt('Naam van de categorie');

    if (!name) {
      return;
    }

    await addChannel.mutateAsync({
      name,
      sort: ((data.length > 0 && data[data.length - 1].sort) || 0) + 1,
    });
  };

  const onEdit = async (id: string, currentName: string) => {
    const name = prompt('Naam van de categorie', currentName);

    if (!name) {
      return;
    }

    await editChannel.mutateAsync({ id, name });
  };

  return (
    <div className="px-2 sm:px-0">
      <h2 className="text-2xl font-bold mb-2 text-center">Categorieën</h2>
      <ul className="my-4 py-2 px-4 rounded-lg">
        {data.map(({ id, name, sort }, i) => (
          <li
            key={id}
            className="relative flex gap-2 justify-between p-3 mb-2 bg-white border-2 rounded-md"
          >
            <h3 className="pl-2 font-medium leading-5 flex-1">{name}</h3>
            {/* TODO: look at this */}
            <button
              onClick={() => {
                moveChannel.mutateAsync({ id, sort: sort - 1 });
                if (data[i - 1])
                  moveChannel.mutateAsync({
                    id: data[i - 1].id,
                    sort: sort,
                  });
              }}
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
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                moveChannel.mutateAsync({ id, sort: sort + 1 });
                if (data[i + 1])
                  moveChannel.mutateAsync({
                    id: data[i + 1].id,
                    sort: sort,
                  });
              }}
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
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>
            <button onClick={() => onEdit(id, name)}>
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
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Weet je zeker dat je deze categorie wilt verwijderen?',
                  )
                ) {
                  deleteChannel.mutateAsync({ id });
                }
              }}
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={onAdd}
        className="fixed right-4 bottom-4 text-white px-4 w-auto h-10 bg-red-600 rounded-full hover:bg-red-700 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
      >
        <svg
          viewBox="0 0 20 20"
          enableBackground="new 0 0 20 20"
          className="w-6 h-6 inline-block mr-1"
        >
          <path
            fill="#FFFFFF"
            d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601
                                    C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399
                                    C15.952,9,16,9.447,16,10z"
          />
        </svg>
        <span>Nieuw</span>
      </button>
    </div>
  );
};

IndexPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
IndexPage.requireAuth = true;

export default IndexPage;
