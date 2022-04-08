import { TodoItem } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { trpc } from '~/utils/trpc';
import { DateContext } from './DateLayout';

type TaskListType = {
  Category: string;
  Editable?: boolean;
};

const TaskList = ({ Category, Editable = false }: TaskListType) => {
  const date = useContext(DateContext);
  const todoItems = trpc.useQuery([
    'todo.byCategory',
    {
      categoryId: Category,
    },
  ]);

  if (!todoItems.isSuccess) return null;

  const items = Editable
    ? todoItems.data
    : todoItems.data.filter(
        ({ rules }) => (rules as Array<boolean>)[date.getDay()],
      );

  if (items.length == 0 && !Editable)
    return <h5 className="text-xl text-center p-5">Geen taken</h5>;

  return (
    <div className="relative overflow-x-auto rounded-lg">
      <table className="border-collapse table-auto w-full text-sm">
        <thead className="text-gray-800 bg-gray-50 border-b-2 text-left">
          <tr>
            <th></th>
            <th className="py-3">Taak</th>
            {Editable && (
              <>
                <th className="text-center">Maandag</th>
                <th className="text-center">Dinsdag</th>
                <th className="text-center">Woensdag</th>
                <th className="text-center">Donderdag</th>
                <th className="text-center">Vrijdag</th>
                <th className="text-center">Zaterdag</th>
              </>
            )}
            <th className="py-3">{!Editable && 'Opmerkingen'}</th>
          </tr>
        </thead>
        <tbody className="text-left">
          {items.map((todoItem) => (
            <Task key={todoItem.id} Editable={Editable} todoItem={todoItem} />
          ))}
          {Editable && <AddRow Category={Category} />}
        </tbody>
      </table>
    </div>
  );
};

type TaskType = {
  todoItem: TodoItem;
  Editable?: boolean;
};

const Task = ({ todoItem, Editable = false }: TaskType) => {
  return Editable ? (
    <EditableTask todoItem={todoItem} />
  ) : (
    <StaticTask todoItem={todoItem} />
  );
};

const EditableTask = ({ todoItem }: TaskType) => {
  const utils = trpc.useContext();
  const EditRowMutation = trpc.useMutation(['todo.edit'], {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['todo.byCategory']);
      await utils.invalidateQueries(['todo.all']);
    },
  });
  const DeleteRowMutation = trpc.useMutation(['todo.delete'], {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['todo.byCategory']);
      await utils.invalidateQueries(['todo.all']);
    },
  });
  const [name, setName] = useState(todoItem.name);
  const [rules, setRules] = useState<Array<boolean>>(
    todoItem.rules as Array<boolean>,
  );

  return (
    <tr className="hover:bg-slate-50">
      <td className="border-b px-6 w-2">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            disabled
          />
        </div>
      </td>
      <td className="border-b py-3 pr-4 w-1/4">
        <input
          className="w-full"
          type="text"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </td>
      {rules.map((rule, i) => (
        <td key={i} className="border-b px-6">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              checked={rule}
              onChange={() =>
                setRules([
                  ...rules.slice(0, i).concat([!rules[i]]),
                  ...rules.slice(i + 1),
                ])
              }
            />
          </div>
        </td>
      ))}
      <td className="border-b">
        <div className="flex justify-center">
          <button
            className="h-8 px-4 m-2 text-sm text-indigo-100 transition-colors duration-150 bg-indigo-700 rounded-lg focus:shadow-outline hover:bg-indigo-800"
            onClick={() =>
              toast.promise(
                EditRowMutation.mutateAsync({
                  id: todoItem.id,
                  data: { name, rules },
                }),
                {
                  loading: 'Opslaan',
                  success: 'Opgeslagen!',
                  error: 'Error tijdens opslaan',
                },
              )
            }
          >
            Opslaan
          </button>
          <button
            className="h-8 px-4 m-2 text-sm text-indigo-100 transition-colors duration-150 bg-indigo-700 rounded-lg focus:shadow-outline hover:bg-indigo-800"
            onClick={() =>
              toast.promise(
                DeleteRowMutation.mutateAsync({ id: todoItem.id }),
                {
                  loading: 'Verwijderen',
                  success: 'Verwijderd!',
                  error: 'Error tijdens verwijderen',
                },
              )
            }
          >
            Verwijder
          </button>
        </div>
      </td>
    </tr>
  );
};

const StaticTask = ({ todoItem }: TaskType) => {
  const date = useContext(DateContext);
  const { data: session, status } = useSession();

  const UpsertMutation = trpc.useMutation(['todoStatus.upsert']);
  const [checked, setChecked] = useState(false);
  const todoStatus = trpc.useQuery([
    'todoStatus.unique',
    {
      date: date,
      todoItemId: todoItem.id,
    },
  ]);

  useEffect(
    () => setChecked(todoStatus.data?.status || false),
    [todoStatus.data?.status],
  );

  const updateChecked = () => {
    const status = !checked;
    setChecked(status);

    UpsertMutation.mutateAsync({
      status,
      date,
      userId,
      todoItemId: todoItem.id,
    });
  };

  if (status != 'authenticated') return null;
  if (!session.user?.id) return null;

  const userId = session.user.id;
  return (
    <tr className="hover:bg-slate-50">
      <td className="border-b px-6 w-2">
        <div className="flex items-center justify-center">
          <input
            checked={checked}
            onChange={updateChecked}
            type="checkbox"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      </td>
      <td className="border-b py-3">{todoItem.name}</td>
      <td className="border-b py-3"></td>
    </tr>
  );
};

type AddRowType = {
  Category: string;
};

const AddRow = ({ Category }: AddRowType) => {
  const utils = trpc.useContext();
  const AddRowMutation = trpc.useMutation(['todo.add'], {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['todo.byCategory']);
      await utils.invalidateQueries(['todo.all']);
    },
  });

  const add = () => {
    AddRowMutation.mutateAsync({
      categoryId: Category,
      name: 'Naam',
      rules: [false, false, false, false, false, false],
    });
  };

  return (
    <tr className="hover:bg-slate-50">
      {[...Array(8)].map((_, i) => (
        <td key={i}></td>
      ))}
      <td className="float-right pr-4 py-3">
        <button onClick={add}>
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
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </td>
    </tr>
  );
};

export default TaskList;
