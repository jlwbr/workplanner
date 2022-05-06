import { TimeOffDay } from '@prisma/client';
import { FC, useState } from 'react';
import { trpc } from '~/utils/trpc';

const groupByKey = (list: any[], key: string) =>
  list.reduce(
    (hash, obj) => ({
      ...hash,
      [obj[key]]: (hash[obj[key]] || []).concat(obj),
    }),
    {},
  );

type CommunicationComponentType = {
  date: Date;
};

const numbers = [
  '201',
  '206',
  '207',
  '209',
  '211',
  '212',
  '213',
  '220',
  '221',
  '222',
  '223',
  '230',
  '231',
  '232',
  '233',
  '234',
  '235',
  '240',
];

const Input: FC<{
  user: any;
  date: Date;
  TimeOffDay: TimeOffDay;
  defaultphoneNumber: string;
  defaultHT: boolean;
}> = ({ user, date, TimeOffDay, defaultphoneNumber, defaultHT }) => {
  const upsertMutation = trpc.useMutation(['communication.upsert']);
  const [selected, setSelected] = useState(defaultHT);
  const [phone, setPhone] = useState<string>(defaultphoneNumber);

  return (
    <tr key={user.id}>
      <td className="border-b border-slate-100 p-4 pl-8 w-full text-slate-700">
        {user.name}
      </td>
      <td className="border-b border-slate-100 p-4 text-slate-700 text-center">
        <input
          checked={selected}
          onChange={() => {
            upsertMutation.mutateAsync({
              date,
              userId: user.id,
              TimeOffDay,
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
            upsertMutation.mutateAsync({
              date,
              userId: user.id,
              TimeOffDay,
              phoneNumber: e.target.value,
              HT: selected,
            });
            setPhone(e.target.value);
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
  TimeOffDay: TimeOffDay;
}> = ({ users, date, TimeOffDay }) => {
  const query = trpc.useQuery(['communication.getAll', { date, TimeOffDay }]);

  if (!query.isSuccess) return null;

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
              </tr>
            </thead>
            <tbody className="bg-white">
              {users.map((user: any) => (
                <Input
                  key={user.id}
                  user={user}
                  date={date}
                  TimeOffDay={TimeOffDay}
                  defaultphoneNumber={
                    query.data.find((d) => d.userId === user.id)?.phoneNumber ??
                    ''
                  }
                  defaultHT={
                    query.data.find((d) => d.userId === user.id)?.HT ?? false
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

const CommunicationComponent = ({ date }: CommunicationComponentType) => {
  const planing = trpc.useQuery([
    'planning.byDate',
    {
      date: date,
    },
  ]);

  if (!planing.isSuccess || !planing.data) return null;

  const users = groupByKey(
    planing.data
      .flatMap((p) =>
        p.PlanningItem.flatMap((i) => [
          ...i.morningAsignee.map((a) => ({
            ...a,
            timeOfDay: 'morning',
          })),
          ...i.afternoonAsignee.map((a) => ({
            ...a,
            timeOfDay: 'afternoon',
          })),
          ...i.eveningAsignee.map((a) => ({
            ...a,
            timeOfDay: 'evening',
          })),
        ]),
      )
      .filter(
        (value, index, self) =>
          index ===
          self.findIndex(
            (t) => t.id === value.id && t.timeOfDay === value.timeOfDay,
          ),
      ),
    'timeOfDay',
  );

  console.log(users);

  return (
    <div className="w-full p-4 px-10">
      <h2 className="text-xl mb-4 mt-2">Ochtend</h2>
      {users.morning && (
        <Table users={users.morning} date={date} TimeOffDay={'MORNING'} />
      )}
      <h2 className="text-xl mb-4 mt-2">Middag</h2>
      {users.afternoon && (
        <Table users={users.afternoon} date={date} TimeOffDay={'AFTERNOON'} />
      )}
      <h2 className="text-xl mb-4 mt-2">Avond</h2>
      {users.evening && (
        <Table users={users.evening} date={date} TimeOffDay={'EVENING'} />
      )}
    </div>
  );
};

export default CommunicationComponent;
