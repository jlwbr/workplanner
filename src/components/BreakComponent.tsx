import { FC, useEffect, useState } from 'react';
import { trpc } from '~/utils/trpc';

type BreakComponentType = {
  date: Date;
};

const numbers = ['1', '2', '3'];

const Input: FC<{
  user: any;
  date: Date;
  defaultNumber: string;
}> = ({ user, date, defaultNumber }) => {
  const context = trpc.useContext();
  const upsertMutation = trpc.useMutation(['break.upsert'], {
    onSuccess: () => {
      context.invalidateQueries(['break.getAll']);
    },
  });
  const [number, setNumber] = useState(defaultNumber);
  useEffect(() => setNumber(defaultNumber), [defaultNumber]);

  return (
    <tr key={user.id}>
      <td className="border-b border-slate-100 p-4 pl-8 w-full text-slate-700">
        {user.name}
      </td>
      <td className="border-b border-slate-100 p-4 pr-8 text-slate-700">
        <select
          value={number}
          onChange={(e) => {
            upsertMutation.mutateAsync({
              date,
              userId: user.id,
              number: parseInt(e.target.value),
            });
            setNumber(e.target.value);
          }}
          className="block bg-white border rounded-sm m-0"
        >
          <option value="" />
          {numbers.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
};

const Table: FC<{
  users: any[];
  date: Date;
}> = ({ users, date }) => {
  const query = trpc.useQuery(['break.getAll', { date }]);

  if (!query.isSuccess) return null;

  return (
    <div className="not-prose relative bg-slate-50 rounded-xl overflow-hidden">
      <div
        style={{ backgroundPosition: '10px 10px' }}
        className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))]"
      ></div>
      <div className="relative rounded-xl overflow-auto">
        <div className="shadow-sm overflow-hidden my-8">
          <table className="border-collapse table-auto w-full text-sm">
            <thead>
              <tr>
                <th className="border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-600 text-left">
                  Naam
                </th>
                <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                  Pauze
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {users.map((user: any) => (
                <Input
                  key={user.id}
                  user={user}
                  date={date}
                  defaultNumber={
                    query.data
                      .find((d) => d.userId === user.id)
                      ?.number.toString() ?? ''
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none border border-black/5 rounded-xl"></div>
    </div>
  );
};

const BreakComponent = ({ date }: BreakComponentType) => {
  const planing = trpc.useQuery([
    'planning.byDate',
    {
      date: date,
    },
  ]);

  if (!planing.isSuccess || !planing.data) return null;

  const users = planing.data
    .flatMap((p) =>
      p.PlanningItem.flatMap((i) => [
        ...i.morningAsignee,
        ...i.afternoonAsignee,
        ...i.eveningAsignee,
      ]),
    )
    .filter(
      (value, index, self) =>
        index === self.findIndex((t) => t.id === value.id),
    );

  return (
    <div className="w-full p-4 px-10">
      <h2 className=" flex-1 text-xl mb-4 mt-2">Pauzes</h2>
      <Table users={users} date={date} />
    </div>
  );
};

export default BreakComponent;
