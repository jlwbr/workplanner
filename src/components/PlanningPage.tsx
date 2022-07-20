import { forwardRef, Fragment, useRef, useState } from 'react';
import ReactToPrint from 'react-to-print';
import { InferQueryOutput, trpc } from '~/utils/trpc';
import Image from 'next/image';
import Logo from '../../public/Karwei_logo.png';
import { Prisma } from '@prisma/client';
import ReactTooltip from 'react-tooltip';
import { GoCheck } from 'react-icons/go';

type PrintComponentType = {
  date: Date;
  users: any[];
  Communication: InferQueryOutput<'communication.getAll'>;
  Break: InferQueryOutput<'break.getAll'>;
  planing: InferQueryOutput<'planning.byDate'>;
  print?: boolean;
};

const Loading = () => (
  <div className="flex flex-col items-center">
    <div className="bg-white border rounded mt-5 p-8">
      <div className="flex flex-col items-center justify-center h-20 w-20">
        <svg
          className="animate-spin h-20 w-20 text-slate-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    </div>
  </div>
);

const PrintComponent = forwardRef<HTMLDivElement, PrintComponentType>(
  ({ date, users, planing, Communication, Break, print }, ref) => {
    const context = trpc.useContext();
    const doneMutation = trpc.useMutation(['planning.tasks.done'], {
      onSuccess: () => {
        context.invalidateQueries(['planning.byDate']);
      },
    });
    const subTaskdoneMutation = trpc.useMutation(['planning.subTask.done'], {
      onSuccess: () => {
        context.invalidateQueries(['planning.byDate']);
      },
    });
    const subTaskFinishAllMutation = trpc.useMutation(
      ['planning.subTasks.finishAll'],
      {
        onSuccess: () => {
          context.invalidateQueries(['planning.byDate']);
        },
      },
    );

    const [open, setOpen] = useState<string[]>([]);

    return (
      <div ref={ref}>
        {!print && <ReactTooltip />}
        <style>{'@page { margin: 2rem !important; }'}</style>
        <div className="flex gap-5 pb-5">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Dagverdeling</h1>
            <h2 className="text-lg">
              {date.toLocaleDateString('nl-NL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
          </div>
          <div
            className={`${
              print ? 'flex' : 'hidden md:flex'
            } flex-col text-[0.6rem] italic`}
          >
            <span>p1: Koffie 10:15 - Lunch: 12:30 - Thee: 15:00 </span>
            <span>p2: Koffie 10:30 - Lunch: 13:00 - Thee: 15:15 </span>
            <span>p3: Koffie 10:45 - Lunch: 13:30 - Thee: 15:30 </span>
          </div>
          <div>
            <Image src={Logo} width={80} height={90} />
          </div>
        </div>
        <div className="not-prose relative bg-slate-50 rounded-xl overflow-hidden">
          <div className="relative rounded-xl overflow-auto">
            <table className="border-collapse table-auto w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b font-bold p-4 pl-8 pt-4 pb-3 text-slate-600 text-left">
                    Taak
                  </th>
                  <th className="border-b font-bold p-4 pt-4 pb-3 text-slate-600 text-center">
                    Ochtend
                  </th>
                  <th className="border-b font-bold p-4 pr-8 pt-4 pb-3 text-slate-600 text-center">
                    Middag
                  </th>
                  <th className="border-b font-bold p-4 pr-8 pt-4 pb-3 text-slate-600 text-center">
                    Avond
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {planing.map((task, i) => {
                  const items = task.PlanningItem.filter(
                    (item) =>
                      item.morningAsignee.length > 0 ||
                      item.afternoonAsignee.length > 0 ||
                      item.eveningAsignee.length > 0,
                  );

                  if (items.length === 0) return null;
                  return (
                    <Fragment key={task.id}>
                      {i > 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="bg-white font-bold h-5 w-full"
                          ></td>
                        </tr>
                      )}
                      <tr>
                        <td
                          colSpan={4}
                          className="border-slate-100 bg-slate-200 font-bold p-1 pl-8 w-full text-slate-700"
                        >
                          {task.channel.name}
                        </td>
                      </tr>
                      {items.map((Planning) => (
                        <tr key={Planning.id}>
                          <td className="border-l border-slate-100 py-2 pl-8 w-full text-slate-700">
                            <strong className="inline-flex items-center gap-2">
                              {!print && (
                                <div
                                  data-tip={
                                    Planning.doneUser
                                      ? `${Planning.doneUser.name} heeft deze taak afgerond`
                                      : 'Deze taak is nog niet afgerond'
                                  }
                                  className="text-xs inline-flex items-center font-bold leading-sm uppercase"
                                >
                                  <input
                                    type="checkbox"
                                    checked={Planning.done}
                                    disabled={
                                      doneMutation.status !== 'idle' &&
                                      doneMutation.status !== 'success'
                                    }
                                    onChange={() =>
                                      doneMutation.mutateAsync({
                                        id: Planning.id,
                                        done: !!!Planning.done,
                                      })
                                    }
                                  />
                                </div>
                              )}
                              <div className="text-sm">{Planning.name}</div>
                            </strong>
                            {Planning.description && (
                              <div className="text-xs">
                                {Planning.description}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap text-xs">
                              {[
                                ...Planning.morningAsignee,
                                ...Planning.afternoonAsignee,
                                ...Planning.eveningAsignee,
                              ].map(({ id, name }) => {
                                if (
                                  Planning.AssigneeText &&
                                  typeof Planning.AssigneeText === 'object'
                                ) {
                                  const text = (
                                    Planning.AssigneeText as Prisma.JsonObject
                                  )[id];
                                  return text ? (
                                    <div key={id}>
                                      {name?.split(' ')[0]}: {text}
                                    </div>
                                  ) : null;
                                }

                                return null;
                              })}
                            </div>
                            {!print && (
                              <div className="flex flex-col justify-center pt-2">
                                {open.find((id) => id === Planning.id) &&
                                  Planning.subTask.map((subTask) => (
                                    <li
                                      key={subTask.id}
                                      data-tip={
                                        subTask.doneUser
                                          ? `${subTask.doneUser.name} heeft deze taak afgerond`
                                          : 'Deze taak is nog niet afgerond'
                                      }
                                      className="inline-flex items-center gap-2"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={subTask.done}
                                        disabled={
                                          (subTaskdoneMutation.status !==
                                            'idle' &&
                                            subTaskdoneMutation.status !==
                                              'success') ||
                                          (subTaskFinishAllMutation.status !==
                                            'idle' &&
                                            subTaskFinishAllMutation.status !==
                                              'success')
                                        }
                                        onChange={() =>
                                          subTaskdoneMutation.mutateAsync({
                                            id: subTask.id,
                                            done: !!!subTask.done,
                                          })
                                        }
                                      />
                                      {subTask.name}
                                    </li>
                                  ))}
                                {Planning.subTask.length > 0 && (
                                  <div className="flex items-center">
                                    <button
                                      className="text-xs inline-flex items-center font-bold leading-sm px-3 py-1 bg-gray-200 text-gray-700 rounded-full whitespace-nowrap"
                                      onClick={() =>
                                        open.find((id) => id === Planning.id)
                                          ? setOpen(
                                              open.filter(
                                                (id) => id !== Planning.id,
                                              ),
                                            )
                                          : setOpen([...open, Planning.id])
                                      }
                                    >
                                      {open.find((id) => id === Planning.id) ? (
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
                                            d="M5 11l7-7 7 7M5 19l7-7 7 7"
                                          />
                                        </svg>
                                      ) : (
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
                                            d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
                                          />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="border-l border-slate-100 py-2 text-slate-700">
                            <div className="grid grid-cols-[auto_auto] gap-1 mx-2">
                              {Planning.morningAsignee.map((item) => (
                                <div
                                  key={item.id}
                                  className="text-xs text-center font-semibold px-3 py-1 rounded-full bg-lime-50 text-slate-700 whitespace-nowrap"
                                >
                                  {item.name?.split(' ')[0] || ''}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="border-l border-slate-100 py-2 text-slate-700">
                            <div className="grid grid-cols-[auto_auto] gap-1 mx-2">
                              {Planning.afternoonAsignee.map((item) => (
                                <div
                                  key={item.id}
                                  className="text-xs text-center font-semibold px-3 py-1 rounded-full bg-lime-50 text-slate-700 whitespace-nowrap"
                                >
                                  {item.name?.split(' ')[0] || ''}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="border-l border-slate-100 py-2 text-slate-700">
                            <div className="grid grid-cols-[auto_auto] gap-1 mx-2">
                              {Planning.eveningAsignee.map((item) => (
                                <div
                                  key={item.id}
                                  className=" w-full text-xs text-center font-semibold px-3 py-1 bg-lime-50 text-slate-700 rounded-full whitespace-nowrap"
                                >
                                  {item.name?.split(' ')[0] || ''}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="absolute inset-0 pointer-events-none border border-black/5 rounded-xl"></div>
        </div>
        <div className="not-prose relative bg-slate-50 rounded-xl overflow-hidden mt-5">
          <div className="relative rounded-xl overflow-auto">
            <table className="border-collapse table-auto w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b font-bold p-4 pl-8 pt-4 pb-3 text-slate-600 text-left">
                    Naam
                  </th>
                  <th className="border-b font-bold p-4 pt-4 pb-3 text-slate-600 text-center">
                    Werktijden
                  </th>
                  <th className="border-b font-bold p-4 pt-4 pb-3 text-slate-600 text-center">
                    Porto
                  </th>
                  <th className="border-b font-bold p-4 pt-4 pb-3 text-slate-600 text-center">
                    Telefoon
                  </th>
                  <th className="border-b font-bold p-4 pr-8 pt-4 pb-3 text-slate-600 text-center">
                    Pauze
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {users.map((user) => {
                  return (
                    <Fragment key={user.id}>
                      <tr>
                        <td className="border-b border-slate-100 py-1 pl-8 w-full text-slate-700">
                          {user.name}
                        </td>
                        <td className="border-b border-slate-100 py-1 w-full text-slate-700 text-center whitespace-nowrap">
                          {user.schedule}
                        </td>
                        <td className="border-b border-slate-100 py-1 text-slate-700 whitespace-nowrap">
                          <div className="w-full flex justify-center">
                            {Communication.find((d) => d.userId === user.id)
                              ?.HT && <GoCheck className="w-4 h-4" />}
                          </div>
                        </td>
                        <td className="border-b border-slate-100 py-1 text-slate-700 text-center">
                          {Communication.find((d) => d.userId === user.id)
                            ?.phoneNumber ?? ''}
                        </td>
                        <td className="border-b border-slate-100 py-1 text-slate-700 text-center">
                          {Break.find(
                            (d) => d.userId === user.id,
                          )?.number?.toString() ?? ''}
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="absolute inset-0 pointer-events-none border border-black/5 rounded-xl"></div>
        </div>
      </div>
    );
  },
);
PrintComponent.displayName = 'PrintComponent';

type PlanningPageType = {
  date: Date;
};

const Planningpage = ({ date }: PlanningPageType) => {
  const componentRef = useRef(null);
  const planing = trpc.useQuery([
    'planning.byDate',
    {
      date: date,
    },
  ]);
  const Break = trpc.useQuery(['break.getAll', { date }]);
  const Communication = trpc.useQuery(['communication.getAll', { date }]);
  const scheduleQuery = trpc.useQuery(['schedule.getAll', { date: date }]);
  if (!planing.isSuccess || !planing.data) return <Loading />;
  if (!Break.isSuccess || !Break.data) return <Loading />;
  if (!Communication.isSuccess || !Communication.data) return <Loading />;

  const schedule = scheduleQuery.data || [];

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
    )
    .map((user) => ({
      ...user,
      schedule: schedule.find((s) => s.userId === user.id)?.schedule,
    }))
    .sort((a, b) => {
      if (!a.schedule || !b.schedule)
        return a.name && b.name ? a.name.localeCompare(b.name) : 0;

      const sort = a.schedule.localeCompare(b.schedule);

      if (sort === 0 && a.name && b.name) return a.name.localeCompare(b.name);

      return sort;
    });

  return (
    <div className="flex flex-col items-center">
      <ReactToPrint
        trigger={() => (
          <button className="btn-primary transition duration-300 ease-in-out focus:outline-none focus:shadow-outline bg-blue-700 hover:bg-blue-900 text-white font-normal py-2 px-4 mr-1 rounded">
            Afdrukken
          </button>
        )}
        content={() => componentRef.current}
      />
      <div className="hidden md:block bg-white border rounded mt-5 p-8">
        <PrintComponent
          ref={componentRef}
          date={date}
          users={users}
          Communication={Communication.data}
          Break={Break.data}
          planing={planing.data}
          print={true}
        />
      </div>
    </div>
  );
};

export { PrintComponent };
export default Planningpage;
