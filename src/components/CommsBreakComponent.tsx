import { FC, useEffect, useState } from 'react';
import { trpc } from '~/utils/trpc';

type CommunicationComponentType = {
  date: Date;
};

const phoneNumbers = [
  '201',
  '212',
  '220',
  '221',
  '222',
  '230',
  '231',
  '232',
  '233',
  '234',
  '240',
];

const numbers = ['1', '2', '3'];

const Input: FC<{
  user: any;
  date: Date;
  defaultphoneNumber: string;
  defaultHT: boolean;
  defaultNumber: string;
}> = ({ user, date, defaultphoneNumber, defaultNumber, defaultHT }) => {
  const context = trpc.useContext();
  const upsertCommsMutation = trpc.useMutation(['communication.upsert'], {
    onSuccess: () => {
      context.invalidateQueries(['communication.getAll']);
    },
  });
  const upsertBreakMutation = trpc.useMutation(['break.upsert'], {
    onSuccess: () => {
      context.invalidateQueries(['break.getAll']);
    },
  });
  const [selected, setSelected] = useState(defaultHT);
  const [phone, setPhone] = useState<string>(defaultphoneNumber);
  const [number, setNumber] = useState(defaultNumber);
  useEffect(() => setNumber(defaultNumber), [defaultNumber]);
  useEffect(() => setSelected(defaultHT), [defaultHT]);
  useEffect(() => setPhone(defaultphoneNumber), [defaultphoneNumber]);

  return (
    <tr key={user.id}>
      <td className="border-b border-slate-100 p-4 pl-8 w-full text-slate-700">
        {user.name}
      </td>
      <td className="border-b border-slate-100 p-4 text-slate-700 text-center">
        <input
          checked={selected}
          onChange={() => {
            upsertCommsMutation.mutateAsync({
              date,
              userId: user.id,
              phoneNumber: phone,
              HT: !selected,
            });
            setSelected(!selected);
          }}
          type="checkbox"
          className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
        />
      </td>
      <td className="border-b border-slate-100 p-4 pr-8 text-slate-700">
        <select
          value={phone}
          onChange={(e) => {
            upsertCommsMutation.mutateAsync({
              date,
              userId: user.id,
              phoneNumber: e.target.value,
              HT: selected,
            });
            setPhone(e.target.value);
          }}
          className="block bg-white border rounded-sm m-0"
        >
          <option value="" />
          {phoneNumbers.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </td>
      <td className="border-b border-slate-100 p-4 pr-8 text-slate-700">
        <select
          value={number}
          onChange={(e) => {
            upsertBreakMutation.mutateAsync({
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
  const commsQuery = trpc.useQuery(['communication.getAll', { date }]);
  const breakQuery = trpc.useQuery(['break.getAll', { date }]);

  if (!commsQuery.isSuccess) return null;
  if (!breakQuery.isSuccess) return null;

  return (
    <div className="not-prose relative bg-slate-50 rounded-xl overflow-hidden">
      <div
        style={{ backgroundPosition: '10px 10px' }}
        className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"
      ></div>
      <div className="relative rounded-xl overflow-auto">
        <div className="shadow-sm overflow-hidden my-8">
          <table className="border-collapse table-auto w-full text-sm">
            <thead>
              <tr>
                <th className="border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-600 text-left">
                  Naam
                </th>
                <th className="border-b font-medium p-4 pt-0 pb-3 text-slate-600 text-center">
                  Porto
                </th>
                <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                  Telefoon
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
                  defaultphoneNumber={
                    commsQuery.data.find((d) => d.userId === user.id)?.phoneNumber ??
                    ''
                  }
                  defaultHT={
                    commsQuery.data.find((d) => d.userId === user.id)?.HT ?? false
                  }
                  defaultNumber={
                    breakQuery.data
                      .find((d) => d.userId === user.id)
                      ?.number?.toString() ?? ''
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

const CommsBreakComponent = ({ date }: CommunicationComponentType) => {
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

  console.log(users);

  return (
    <div className="w-full p-4 px-10">
      <h2 className="text-xl mb-4 mt-2">Comunicatiemiddelen &amp; pauzes</h2>
      <Table users={users} date={date} />
    </div>
  );
};

export default CommsBreakComponent;
