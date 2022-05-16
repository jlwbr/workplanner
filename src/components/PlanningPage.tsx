import { forwardRef, useRef } from 'react';
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

    if (!planing.isSuccess || !planing.data) return null;
    if (!MorningBreak.isSuccess || !MorningBreak.data) return null;
    if (!AfternoonBreak.isSuccess || !AfternoonBreak.data) return null;
    if (!EveningBreak.isSuccess || !EveningBreak.data) return null;
    if (!MorningCommunication.isSuccess || !MorningCommunication.data)
      return null;
    if (!AfternoonCommunication.isSuccess || !AfternoonCommunication.data)
      return null;
    if (!EveningCommunication.isSuccess || !EveningCommunication.data)
      return null;

    const data = planing.data.flatMap(({ PlanningItem }) => PlanningItem);
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
        <div className="flex gap-2 pb-5">
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
          <div
            style={{ backgroundPosition: '10px 10px' }}
            className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"
          ></div>
          <div className="relative rounded-xl overflow-auto">
            <div className="shadow-sm overflow-hidden my-8">
              <table className="border-collapse table-auto w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b font-bold p-4 pl-8 pt-0 pb-3 text-slate-600 text-left">
                      Taak
                    </th>
                    <th className="border-b font-bold p-4 pt-0 pb-3 text-slate-600 text-center">
                      Ochtend
                    </th>
                    <th className="border-b font-bold p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                      Middag
                    </th>
                    <th className="border-b font-bold p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                      Avond
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {data.map((Planning) => {
                    return (
                      <tr key={Planning.id}>
                        <td className="border-b border-slate-100 p-4 pl-8 w-full text-slate-700">
                          {Planning.name}
                        </td>
                        <td className="border-b border-slate-100 p-4 text-slate-700 text-center">
                          {Planning.morningAsignee.map((item) => (
                            <div
                              key={item.id}
                              className="text-xs inline-flex flex-col items-center font-bold leading-sm px-3 py-1 mr-2 bg-lime-200 text-lime-700 rounded-full"
                            >
                              <span className="whitespace-nowrap">
                                {item.name}
                              </span>
                              <span className="whitespace-nowrap">
                                {MorningCommunicationData[item.id] &&
                                  MorningCommunicationData[item.id][0]?.HT &&
                                  'P '}
                                {MorningCommunicationData[item.id] &&
                                  MorningCommunicationData[item.id][0]
                                    ?.phoneNumber}
                                {MorningCommunicationData[item.id] &&
                                  MorningBreakData[item.id] &&
                                  ' / '}
                                {MorningBreakData[item.id] &&
                                  `p${MorningBreakData[item.id][0]?.number}`}
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="border-b border-slate-100 p-4 text-slate-700 text-center">
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
                                  AfternoonCommunicationData[item.id][0]?.HT &&
                                  'P '}
                                {AfternoonCommunicationData[item.id] &&
                                  AfternoonCommunicationData[item.id][0]
                                    ?.phoneNumber}
                                {AfternoonCommunicationData[item.id] &&
                                  AfternoonBreakData[item.id] &&
                                  '/'}
                                {AfternoonBreakData[item.id] &&
                                  `P${AfternoonBreakData[item.id][0]?.number}`}
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="border-b border-slate-100 p-4 text-slate-700 text-center">
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
                                  EveningCommunicationData[item.id][0]?.HT &&
                                  'P '}
                                {EveningCommunicationData[item.id] &&
                                  EveningCommunicationData[item.id][0]
                                    ?.phoneNumber}
                                {EveningCommunicationData[item.id] &&
                                  EveningBreakData[item.id] &&
                                  '/'}
                                {EveningBreakData[item.id] &&
                                  `P${EveningBreakData[item.id][0]?.number}`}
                              </span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
      <div className="bg-white border rounded mt-5">
        <PrintComponent ref={componentRef} date={date} />
      </div>
    </div>
  );
};

export default Planningpage;
