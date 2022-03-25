const TaskList = () => {
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
          {[...(new Array(5))].map((_, i) => (
            <Task name={`Taak ${i}`} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

type TaskType = {
  name: string
}

const Task = ({ name }: TaskType) => {
  return (
    <tr className="hover:bg-slate-50">
      <td className="border-b px-6 w-2">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      </td>
      <td className="border-b py-3">{name}</td>
      <td className="border-b py-3">Jaja</td>
    </tr>
  );
};

export default TaskList;
