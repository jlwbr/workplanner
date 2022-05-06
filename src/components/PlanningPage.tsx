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

type PlanningPageType = {
  date: Date;
};

const Table: FC<{
  users: any[];
  date: Date;
  TimeOffDay: TimeOffDay;
}> = ({ users, date, TimeOffDay }) => {
  const communications = trpc.useQuery([
    'communication.getAll',
    { date, TimeOffDay },
  ]);
  const breaks = trpc.useQuery(['break.getAll', { date, TimeOffDay }]);

  if (!communications.isSuccess || !breaks.isSuccess) return null;

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
                <tr key={user.id}>
                  <td className="border-b border-slate-100 p-4 pl-8 w-full text-slate-700">
                    {user.name}
                  </td>
                  <td className="border-b border-slate-100 p-4 text-slate-700 text-center">
                    {communications.data.find((d) => d.userId === user.id)?.HT}
                  </td>
                  <td className="border-b border-slate-100 p-4 pr-8 text-slate-700">
                    {
                      communications.data.find((d) => d.userId === user.id)
                        ?.phoneNumber
                    }
                  </td>
                  <td className="border-b border-slate-100 p-4 text-slate-700 text-center">
                    {breaks.data.find((d) => d.userId === user.id)?.number}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none border border-black/5 rounded-xl"></div>
    </div>
  );
};

const Planningpage = ({ date }: PlanningPageType) => {
  const planing = trpc.useQuery([
    'planning.byDate',
    {
      date: date,
    },
  ]);

  if (!planing.isSuccess || !planing.data) return null;

  return (
    <>
      {planing.data.map((p) =>
        p.PlanningItem.map((d) => (
          <div key={d.id} className="w-full p-4 px-10">
            <h2 className="text-xl mb-4 mt-2">{d.name}</h2>
            {d.morningAsignee.length > 0 && (
              <>
                <h2 className="text-xl mb-4 mt-2">Ochtend</h2>

                <Table
                  users={d.morningAsignee}
                  date={date}
                  TimeOffDay={'MORNING'}
                />
              </>
            )}
            {d.afternoonAsignee.length > 0 && (
              <>
                <h2 className="text-xl mb-4 mt-2">Middag</h2>
                <Table
                  users={d.afternoonAsignee}
                  date={date}
                  TimeOffDay={'AFTERNOON'}
                />
              </>
            )}
            {d.eveningAsignee.length > 0 && (
              <>
                <h2 className="text-xl mb-4 mt-2">Avond</h2>
                <Table
                  users={d.eveningAsignee}
                  date={date}
                  TimeOffDay={'EVENING'}
                />
              </>
            )}
          </div>
        )),
      )}
    </>
  );
};

export default Planningpage;
