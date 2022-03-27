import { TodoItem } from '@prisma/client';
import { useState } from 'react';
import { trpc } from '~/utils/trpc';

type TaskListType = {
  Category: string;
  Editable?: boolean;
};

const TaskList = ({ Category, Editable = false }: TaskListType) => {
  const todoItems = trpc.useQuery([
    'todo.byCategory',
    {
      categoryId: Category,
    },
  ]);

  if (!todoItems.isSuccess) return null;

  return (
    <div className="relative overflow-x-auto rounded-lg">
      <table className="border-collapse table-auto w-full text-sm">
        <thead className="text-gray-800 bg-gray-50 border-b-2 text-left">
          <tr>
            <th></th>
            <th className="py-3">Taak</th>
            <th className="py-3">Opmerkingen</th>
          </tr>
        </thead>
        <tbody className="text-left">
          {todoItems.data.map((todoItem) => (
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
  const [name, setName] = useState(todoItem.name);

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
          onBlur={() =>
            EditRowMutation.mutateAsync({ id: todoItem.id, data: { name } })
          }
        />
      </td>
      <td className="border-b py-3"></td>
    </tr>
  );
};

const StaticTask = ({ todoItem }: TaskType) => (
  <tr className="hover:bg-slate-50">
    <td className="border-b px-6 w-2">
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
      </div>
    </td>
    <td className="border-b py-3">{todoItem.name}</td>
    <td className="border-b py-3"></td>
  </tr>
);

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
      name: '',
      rules: [true, false, false, false, false],
      done: [true],
    });
  };

  return (
    <tr className="hover:bg-slate-50">
      <td></td>
      <td></td>
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
