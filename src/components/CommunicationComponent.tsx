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
      {users.morning &&
        users.morning.map((u: any) => (
          <div key={u.id} className="p-5 bg-white rounded-lg shadow">
            {u.name}
          </div>
        ))}
      <h2 className="text-xl mb-4 mt-2">Middag</h2>
      {users.afternoon &&
        users.afternoon.map((u: any) => (
          <div key={u.id} className="p-5 bg-white rounded-lg shadow">
            {u.name}
          </div>
        ))}
      <h2 className="text-xl mb-4 mt-2">Avond</h2>
      {users.evening &&
        users.evening.map((u: any) => (
          <div key={u.id} className="p-5 bg-white rounded-lg shadow">
            {u.name}
          </div>
        ))}
    </div>
  );
};

export default CommunicationComponent;
