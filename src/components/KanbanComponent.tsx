import { useContext } from 'react';
import { trpc } from '~/utils/trpc';
import { DateContext } from './DateLayout';

const KanbanComponent = () => {
  const date = useContext(DateContext);
  const planing = trpc.useQuery([
    'planning.byDate',
    {
      date: date,
    },
  ]);

  if (!planing.isSuccess) return null;

  return (
    <div className="flex flex-col md:flex-row w-full h-full px-4 md:gap-6 overflow-x-scroll">
      {planing.data.map((plan) => (
        <KanbanList key={plan.id} title={plan.channel.name} />
      ))}
    </div>
  );
};

type KanbanListType = {
  title: string;
};

const KanbanList = ({ title }: KanbanListType) => (
  <div className="grow max-w-md min-w-[16rem]">
    <h1 className="text-lg font-bold text-gray-900 py-3">{title}</h1>
    <div className="flex w-full flex-col gap-4">
      <KanbanItem />
      <KanbanItem />
      <KanbanItem />
    </div>
  </div>
);

const KanbanItem = () => (
  <div className="bg-white rounded-md shadow-md">
    <div className="p-5">
      <div className="flex justify-between content-center tracking-tight pb-2">
        <strong className="inline-flex items-center">
          <h2 className="font-bold text-gray-900">Balie / Kassa</h2>
        </strong>
        <strong className="inline-flex items-center border border-gray-200 rounded relative px-2.5 py-1.5 text-xs font-medium">
          <span className="text-gray-700"> Balie / Kassa </span>
        </strong>
      </div>
      <p>Hallo dit een beschrijving, wel alles netjes opruimen he</p>
      <div className="pt-2">
        <h2 className="font-bold text-gray-900">Ochtend</h2>
        <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
          Joel
        </span>
        <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
          Sander
        </span>
        <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-dashed border-2 rounded-full">
          Leeg
        </span>
      </div>
      <div className="pt-2">
        <h2 className="font-bold text-gray-900">Middag</h2>
        <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
          Joel
        </span>
        <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
          Sander
        </span>
        <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-dashed border-2 rounded-full">
          Leeg
        </span>
      </div>
      <div className="pt-2">
        <h2 className="font-bold text-gray-900">Avond</h2>
        <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
          Joel
        </span>
        <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
          Sander
        </span>
        <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
          Mike
        </span>
      </div>
    </div>
  </div>
);

export default KanbanComponent;
