import { forwardRef, Fragment, useRef } from 'react';
import ReactToPrint from 'react-to-print';
import { trpc } from '~/utils/trpc';
import Image from 'next/image';
import Logo from '../../public/Karwei_logo.png';

const groupByKey = (list: any[], key: string) =>
  list.reduce(
    (hash, obj) => ({
      ...hash,
      [obj[key]]: (hash[obj[key]] || []).concat(obj),
    }),
    {},
  );

type PrintComponentType = {
  date: Date;
};

const Loading = () => (
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
);

const PrintComponent = forwardRef<HTMLDivElement, PrintComponentType>(
  ({ date }, ref) => {
    const planing = trpc.useQuery([
      'planning.byDate',
      {
        date: date,
      },
    ]);
    const MorningBreak = trpc.useQuery([
      'break.getAll',
      {
        date: date,
        TimeOffDay: 'MORNING',
      },
    ]);
    const AfternoonBreak = trpc.useQuery([
      'break.getAll',
      {
        date: date,
        TimeOffDay: 'AFTERNOON',
      },
    ]);
    const EveningBreak = trpc.useQuery([
      'break.getAll',
      {
        date: date,
        TimeOffDay: 'EVENING',
      },
    ]);
    const MorningCommunication = trpc.useQuery([
      'communication.getAll',
      { date, TimeOffDay: 'MORNING' },
    ]);
    const AfternoonCommunication = trpc.useQuery([
      'communication.getAll',
      { date, TimeOffDay: 'AFTERNOON' },
    ]);
    const EveningCommunication = trpc.useQuery([
      'communication.getAll',
      { date, TimeOffDay: 'EVENING' },
    ]);

    if (!planing.isSuccess || !planing.data) return <Loading />;
    if (!MorningBreak.isSuccess || !MorningBreak.data) return <Loading />;
    if (!AfternoonBreak.isSuccess || !AfternoonBreak.data) return <Loading />;
    if (!EveningBreak.isSuccess || !EveningBreak.data) return <Loading />;
    if (!MorningCommunication.isSuccess || !MorningCommunication.data)
      return <Loading />;
    if (!AfternoonCommunication.isSuccess || !AfternoonCommunication.data)
      return <Loading />;
    if (!EveningCommunication.isSuccess || !EveningCommunication.data)
      return <Loading />;

    const MorningBreakData = groupByKey(MorningBreak.data, 'userId');
    const AfternoonBreakData = groupByKey(AfternoonBreak.data, 'userId');
    const EveningBreakData = groupByKey(EveningBreak.data, 'userId');

    const MorningCommunicationData = groupByKey(
      MorningCommunication.data,
      'userId',
    );
    const AfternoonCommunicationData = groupByKey(
      AfternoonCommunication.data,
      'userId',
    );
    const EveningCommunicationData = groupByKey(
      EveningCommunication.data,
      'userId',
    );

    return (
      <div ref={ref}>
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
          <div className="flex flex-col text-xs italic">
            <span>p1: Koffie 10:15; Lunch: 12:30; Thee: 15:00 </span>
            <span>p2: Koffie 10:30; Lunch: 13:00; Thee: 15:15 </span>
            <span>p3: Koffie 10:45; Lunch: 13:30; Thee: 15:30 </span>
          </div>
          <div>
            <Image src={Logo} width={116} height={130} />
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
                {planing.data.map((task) => (
                  <Fragment key={task.id}>
                    <tr>
                      <td
                        colSpan={4}
                        className="border-b border-slate-100 bg-slate-200 font-bold p-2 pl-8 w-full text-slate-700"
                      >
                        {task.channel.name}
                      </td>
                    </tr>
                    {task.PlanningItem.map((Planning) => (
                      <tr key={Planning.id}>
                        <td className="border-b border-slate-100 p-4 pl-8 w-full text-slate-700">
                          <div>{Planning.name}</div>
                          {Planning.description && (
                            <div className="text-xs">
                              {Planning.description}
                            </div>
                          )}
                        </td>
                        <td className="border-b border-slate-100 p-4 text-slate-700 text-center">
                          <div className="flex flex-col justify-start gap-1">
                            {Planning.morningAsignee.map((item) => (
                              <div
                                key={item.id}
                                className="text-xs inline-flex flex-col items-center font-bold leading-sm px-3 py-1 bg-lime-200 text-lime-700 rounded-full"
                              >
                                <span className="whitespace-nowrap">
                                  {item.name}
                                </span>
                                <span className="whitespace-nowrap">
                                  {MorningCommunicationData[item.id] &&
                                    MorningCommunicationData[item.id][0]
                                      ?.HT && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 inline-block pr-1"
                                        data-name="Layer 1"
                                        viewBox="0 0 55.37 122.88"
                                      >
                                        <path d="M4.26,80.11a21.36,21.36,0,0,0,.92,4.45l0,.09a23.46,23.46,0,0,1,1.18,8.14v24.35a1.44,1.44,0,0,0,.44,1,1.48,1.48,0,0,0,1,.44H47.5A1.49,1.49,0,0,0,49,117.14V92.73a23.86,23.86,0,0,1,1.21-8.17h0A20.65,20.65,0,0,0,51.11,80V47.12a1.47,1.47,0,0,0-.42-1h0a1.48,1.48,0,0,0-1-.44H5.74a1.47,1.47,0,0,0-1,.43h0a1.47,1.47,0,0,0-.43,1v33Zm31.5,23H40a.78.78,0,0,1,.78.77v4.21a.78.78,0,0,1-.78.78H35.76a.78.78,0,0,1-.78-.78V103.9a.78.78,0,0,1,.78-.77Zm-10.18,0h4.21a.78.78,0,0,1,.78.77v4.21a.78.78,0,0,1-.78.78H25.58a.78.78,0,0,1-.78-.78V103.9a.78.78,0,0,1,.78-.77Zm-10.19,0H19.6a.78.78,0,0,1,.78.77v4.21a.78.78,0,0,1-.78.78H15.39a.78.78,0,0,1-.77-.78V103.9a.78.78,0,0,1,.77-.77ZM35.76,92.62H40a.78.78,0,0,1,.78.77v4.22a.78.78,0,0,1-.78.77H35.76a.78.78,0,0,1-.78-.77V93.39a.78.78,0,0,1,.78-.77Zm-10.18,0h4.21a.78.78,0,0,1,.78.77v4.22a.78.78,0,0,1-.78.77H25.58a.78.78,0,0,1-.78-.77V93.39a.78.78,0,0,1,.78-.77Zm-10.19,0H19.6a.78.78,0,0,1,.78.77v4.22a.78.78,0,0,1-.78.77H15.39a.78.78,0,0,1-.77-.77V93.39a.78.78,0,0,1,.77-.77ZM35.76,82.11H40a.78.78,0,0,1,.78.78V87.1a.78.78,0,0,1-.78.77H35.76A.78.78,0,0,1,35,87.1V82.89a.78.78,0,0,1,.78-.78Zm-10.18,0h4.21a.78.78,0,0,1,.78.78V87.1a.78.78,0,0,1-.78.77H25.58a.78.78,0,0,1-.78-.77V82.89a.78.78,0,0,1,.78-.78Zm-10.19,0H19.6a.78.78,0,0,1,.78.78V87.1a.78.78,0,0,1-.78.77H15.39a.78.78,0,0,1-.77-.77V82.89a.78.78,0,0,1,.77-.78Zm-4.9-50.66V2.93a2.93,2.93,0,0,1,5.86,0V31.45h1.16a2.45,2.45,0,0,1,1.65.64l.09.08A2.46,2.46,0,0,1,20,33.92v7.46H33.75l1.33-7.46a1.38,1.38,0,0,1,1.27-1.27h8.18a1.37,1.37,0,0,1,1.27,1.27l1.33,7.46h2.5a5.75,5.75,0,0,1,5.74,5.74V80h0v.08a23.28,23.28,0,0,1-1.08,5.6,20,20,0,0,0-1.06,6.81v24.61a5.74,5.74,0,0,1-5.73,5.74H7.87a5.75,5.75,0,0,1-5.74-5.74V92.68a20.08,20.08,0,0,0-1-6.87l0-.09A23.49,23.49,0,0,1,0,80.32L0,80V47.12a5.7,5.7,0,0,1,1.68-4h0a5.73,5.73,0,0,1,4.05-1.69H6.86V33.92a2.48,2.48,0,0,1,.72-1.74h0a2.44,2.44,0,0,1,1.74-.72Zm2.68,19.77h29a3.35,3.35,0,0,1,2.36,1l.13.15a3.35,3.35,0,0,1,.84,2.21V68.61a3.28,3.28,0,0,1-1,2.35h0a3.35,3.35,0,0,1-2.35,1h-29a3.32,3.32,0,0,1-2.35-1h0a3.34,3.34,0,0,1-1-2.36V54.55a3.33,3.33,0,0,1,3.34-3.33ZM41.8,55H13.56V68.22H41.8V55Z" />
                                      </svg>
                                    )}
                                  {MorningCommunicationData[item.id] &&
                                    MorningCommunicationData[item.id][0]
                                      ?.phoneNumber}
                                  {MorningCommunicationData[item.id] &&
                                    MorningBreakData[item.id] &&
                                    '/'}
                                  {MorningBreakData[item.id] &&
                                    `p${MorningBreakData[item.id][0]?.number}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="border-b border-slate-100 p-4 text-slate-700 text-center">
                          <div className="flex flex-col justify-start gap-1">
                            {Planning.afternoonAsignee.map((item) => (
                              <div
                                key={item.id}
                                className="text-xs inline-flex flex-col items-center font-bold leading-sm px-3 py-1 mr-2 bg-lime-200 text-lime-700 rounded-full"
                              >
                                <span className="whitespace-nowrap">
                                  {item.name}
                                </span>
                                <span className="whitespace-nowrap">
                                  {AfternoonCommunicationData[item.id] &&
                                    AfternoonCommunicationData[item.id][0]
                                      ?.HT && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 inline-block pr-1"
                                        data-name="Layer 1"
                                        viewBox="0 0 55.37 122.88"
                                      >
                                        <path d="M4.26,80.11a21.36,21.36,0,0,0,.92,4.45l0,.09a23.46,23.46,0,0,1,1.18,8.14v24.35a1.44,1.44,0,0,0,.44,1,1.48,1.48,0,0,0,1,.44H47.5A1.49,1.49,0,0,0,49,117.14V92.73a23.86,23.86,0,0,1,1.21-8.17h0A20.65,20.65,0,0,0,51.11,80V47.12a1.47,1.47,0,0,0-.42-1h0a1.48,1.48,0,0,0-1-.44H5.74a1.47,1.47,0,0,0-1,.43h0a1.47,1.47,0,0,0-.43,1v33Zm31.5,23H40a.78.78,0,0,1,.78.77v4.21a.78.78,0,0,1-.78.78H35.76a.78.78,0,0,1-.78-.78V103.9a.78.78,0,0,1,.78-.77Zm-10.18,0h4.21a.78.78,0,0,1,.78.77v4.21a.78.78,0,0,1-.78.78H25.58a.78.78,0,0,1-.78-.78V103.9a.78.78,0,0,1,.78-.77Zm-10.19,0H19.6a.78.78,0,0,1,.78.77v4.21a.78.78,0,0,1-.78.78H15.39a.78.78,0,0,1-.77-.78V103.9a.78.78,0,0,1,.77-.77ZM35.76,92.62H40a.78.78,0,0,1,.78.77v4.22a.78.78,0,0,1-.78.77H35.76a.78.78,0,0,1-.78-.77V93.39a.78.78,0,0,1,.78-.77Zm-10.18,0h4.21a.78.78,0,0,1,.78.77v4.22a.78.78,0,0,1-.78.77H25.58a.78.78,0,0,1-.78-.77V93.39a.78.78,0,0,1,.78-.77Zm-10.19,0H19.6a.78.78,0,0,1,.78.77v4.22a.78.78,0,0,1-.78.77H15.39a.78.78,0,0,1-.77-.77V93.39a.78.78,0,0,1,.77-.77ZM35.76,82.11H40a.78.78,0,0,1,.78.78V87.1a.78.78,0,0,1-.78.77H35.76A.78.78,0,0,1,35,87.1V82.89a.78.78,0,0,1,.78-.78Zm-10.18,0h4.21a.78.78,0,0,1,.78.78V87.1a.78.78,0,0,1-.78.77H25.58a.78.78,0,0,1-.78-.77V82.89a.78.78,0,0,1,.78-.78Zm-10.19,0H19.6a.78.78,0,0,1,.78.78V87.1a.78.78,0,0,1-.78.77H15.39a.78.78,0,0,1-.77-.77V82.89a.78.78,0,0,1,.77-.78Zm-4.9-50.66V2.93a2.93,2.93,0,0,1,5.86,0V31.45h1.16a2.45,2.45,0,0,1,1.65.64l.09.08A2.46,2.46,0,0,1,20,33.92v7.46H33.75l1.33-7.46a1.38,1.38,0,0,1,1.27-1.27h8.18a1.37,1.37,0,0,1,1.27,1.27l1.33,7.46h2.5a5.75,5.75,0,0,1,5.74,5.74V80h0v.08a23.28,23.28,0,0,1-1.08,5.6,20,20,0,0,0-1.06,6.81v24.61a5.74,5.74,0,0,1-5.73,5.74H7.87a5.75,5.75,0,0,1-5.74-5.74V92.68a20.08,20.08,0,0,0-1-6.87l0-.09A23.49,23.49,0,0,1,0,80.32L0,80V47.12a5.7,5.7,0,0,1,1.68-4h0a5.73,5.73,0,0,1,4.05-1.69H6.86V33.92a2.48,2.48,0,0,1,.72-1.74h0a2.44,2.44,0,0,1,1.74-.72Zm2.68,19.77h29a3.35,3.35,0,0,1,2.36,1l.13.15a3.35,3.35,0,0,1,.84,2.21V68.61a3.28,3.28,0,0,1-1,2.35h0a3.35,3.35,0,0,1-2.35,1h-29a3.32,3.32,0,0,1-2.35-1h0a3.34,3.34,0,0,1-1-2.36V54.55a3.33,3.33,0,0,1,3.34-3.33ZM41.8,55H13.56V68.22H41.8V55Z" />
                                      </svg>
                                    )}
                                  {AfternoonCommunicationData[item.id] &&
                                    AfternoonCommunicationData[item.id][0]
                                      ?.phoneNumber}
                                  {AfternoonCommunicationData[item.id] &&
                                    AfternoonBreakData[item.id] &&
                                    '/'}
                                  {AfternoonBreakData[item.id] &&
                                    `p${
                                      AfternoonBreakData[item.id][0]?.number
                                    }`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="border-b border-slate-100 p-4 text-slate-700 text-center">
                          <div className="flex flex-col justify-start gap-1">
                            {Planning.eveningAsignee.map((item) => (
                              <div
                                key={item.id}
                                className="text-xs inline-flex flex-col items-center font-bold leading-sm px-3 py-1 mr-2 bg-lime-200 text-lime-700 rounded-full"
                              >
                                <span className="whitespace-nowrap">
                                  {item.name}
                                </span>
                                <span className="whitespace-nowrap">
                                  {EveningCommunicationData[item.id] &&
                                    EveningCommunicationData[item.id][0]
                                      ?.HT && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 inline-block pr-1"
                                        data-name="Layer 1"
                                        viewBox="0 0 55.37 122.88"
                                      >
                                        <path d="M4.26,80.11a21.36,21.36,0,0,0,.92,4.45l0,.09a23.46,23.46,0,0,1,1.18,8.14v24.35a1.44,1.44,0,0,0,.44,1,1.48,1.48,0,0,0,1,.44H47.5A1.49,1.49,0,0,0,49,117.14V92.73a23.86,23.86,0,0,1,1.21-8.17h0A20.65,20.65,0,0,0,51.11,80V47.12a1.47,1.47,0,0,0-.42-1h0a1.48,1.48,0,0,0-1-.44H5.74a1.47,1.47,0,0,0-1,.43h0a1.47,1.47,0,0,0-.43,1v33Zm31.5,23H40a.78.78,0,0,1,.78.77v4.21a.78.78,0,0,1-.78.78H35.76a.78.78,0,0,1-.78-.78V103.9a.78.78,0,0,1,.78-.77Zm-10.18,0h4.21a.78.78,0,0,1,.78.77v4.21a.78.78,0,0,1-.78.78H25.58a.78.78,0,0,1-.78-.78V103.9a.78.78,0,0,1,.78-.77Zm-10.19,0H19.6a.78.78,0,0,1,.78.77v4.21a.78.78,0,0,1-.78.78H15.39a.78.78,0,0,1-.77-.78V103.9a.78.78,0,0,1,.77-.77ZM35.76,92.62H40a.78.78,0,0,1,.78.77v4.22a.78.78,0,0,1-.78.77H35.76a.78.78,0,0,1-.78-.77V93.39a.78.78,0,0,1,.78-.77Zm-10.18,0h4.21a.78.78,0,0,1,.78.77v4.22a.78.78,0,0,1-.78.77H25.58a.78.78,0,0,1-.78-.77V93.39a.78.78,0,0,1,.78-.77Zm-10.19,0H19.6a.78.78,0,0,1,.78.77v4.22a.78.78,0,0,1-.78.77H15.39a.78.78,0,0,1-.77-.77V93.39a.78.78,0,0,1,.77-.77ZM35.76,82.11H40a.78.78,0,0,1,.78.78V87.1a.78.78,0,0,1-.78.77H35.76A.78.78,0,0,1,35,87.1V82.89a.78.78,0,0,1,.78-.78Zm-10.18,0h4.21a.78.78,0,0,1,.78.78V87.1a.78.78,0,0,1-.78.77H25.58a.78.78,0,0,1-.78-.77V82.89a.78.78,0,0,1,.78-.78Zm-10.19,0H19.6a.78.78,0,0,1,.78.78V87.1a.78.78,0,0,1-.78.77H15.39a.78.78,0,0,1-.77-.77V82.89a.78.78,0,0,1,.77-.78Zm-4.9-50.66V2.93a2.93,2.93,0,0,1,5.86,0V31.45h1.16a2.45,2.45,0,0,1,1.65.64l.09.08A2.46,2.46,0,0,1,20,33.92v7.46H33.75l1.33-7.46a1.38,1.38,0,0,1,1.27-1.27h8.18a1.37,1.37,0,0,1,1.27,1.27l1.33,7.46h2.5a5.75,5.75,0,0,1,5.74,5.74V80h0v.08a23.28,23.28,0,0,1-1.08,5.6,20,20,0,0,0-1.06,6.81v24.61a5.74,5.74,0,0,1-5.73,5.74H7.87a5.75,5.75,0,0,1-5.74-5.74V92.68a20.08,20.08,0,0,0-1-6.87l0-.09A23.49,23.49,0,0,1,0,80.32L0,80V47.12a5.7,5.7,0,0,1,1.68-4h0a5.73,5.73,0,0,1,4.05-1.69H6.86V33.92a2.48,2.48,0,0,1,.72-1.74h0a2.44,2.44,0,0,1,1.74-.72Zm2.68,19.77h29a3.35,3.35,0,0,1,2.36,1l.13.15a3.35,3.35,0,0,1,.84,2.21V68.61a3.28,3.28,0,0,1-1,2.35h0a3.35,3.35,0,0,1-2.35,1h-29a3.32,3.32,0,0,1-2.35-1h0a3.34,3.34,0,0,1-1-2.36V54.55a3.33,3.33,0,0,1,3.34-3.33ZM41.8,55H13.56V68.22H41.8V55Z" />
                                      </svg>
                                    )}
                                  {EveningCommunicationData[item.id] &&
                                    EveningCommunicationData[item.id][0]
                                      ?.phoneNumber}
                                  {EveningCommunicationData[item.id] &&
                                    EveningBreakData[item.id] &&
                                    '/'}
                                  {EveningBreakData[item.id] &&
                                    `p${EveningBreakData[item.id][0]?.number}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
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
      <div className="bg-white border rounded mt-5 p-8">
        <PrintComponent ref={componentRef} date={date} />
      </div>
    </div>
  );
};

export default Planningpage;
