import { PlanningItem } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useContext, useState } from 'react';
import { trpc } from '~/utils/trpc';
import { DateContext } from './DateLayout';
import PlanningEditor, { PlanningInputsType } from './PlanningEditor';

// TODO: We might want to refactor this file

const defaultEditingRuleData: PlanningItem = {
  id: '',
  name: '',
  ownerId: '',
  priority: 0,
  description: '',
  maxMorning: 0,
  maxAfternoon: 0,
  maxEvening: 0,
  planningId: '',
  planningRuleId: null,
};

const PlanningInputs: PlanningInputsType = [
  {
    field: 'name',
    label: 'Naam',
    input: 'text',
  },
  {
    field: 'priority',
    label: 'Prioriteit',
    input: 'number',
    placeholder: 'Geen prioriteit',
  },
  {
    field: 'description',
    label: 'Beschrijving',
    input: 'textarea',
  },
  {
    field: 'maxMorning',
    label: 'Max. aantal ochtend',
    input: 'number',
    placeholder: 'Geen limiet',
  },
  {
    field: 'maxAfternoon',
    label: 'Max. aantal middag',
    input: 'number',
    placeholder: 'Geen limiet',
  },
  {
    field: 'maxEvening',
    label: 'Max. aantal avond',
    input: 'number',
    placeholder: 'Geen limiet',
  },
];

const KanbanComponent = () => {
  const date = useContext(DateContext);
  const context = trpc.useContext();
  const filterDay = trpc.useMutation(['prolog.FilterDay'], {
    onSuccess: () => {
      context.invalidateQueries(['planning.byDate']);
    },
  });
  const planing = trpc.useQuery([
    'planning.byDate',
    {
      date: date,
    },
  ]);
  const UpsertRule = trpc.useMutation(['planning.tasks.upsert'], {
    onSuccess: () => {
      context.invalidateQueries(['planning.byDate']);
    },
  });
  const deleteMutation = trpc.useMutation(['planning.tasks.delete'], {
    onSuccess: () => {
      context.invalidateQueries(['planning.byDate']);
    },
  });
  const [open, setOpen] = useState(false);
  const [editingRuleData, setEditingRuleData] = useState<PlanningItem>(
    defaultEditingRuleData,
  );

  const openTask = (data?: PlanningItem) => {
    if (data) {
      setEditingRuleData(data);
    } else {
      setEditingRuleData(defaultEditingRuleData);
    }
    setOpen(true);
  };

  const onClose = async (cancel?: boolean) => {
    if (cancel) {
      setOpen(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, planningRuleId, ...data } = editingRuleData;

    if (Object.values(data).some((x) => x === null || x === '')) {
      alert('Niet alle velden zijn ingevuld');
      return;
    }

    await UpsertRule.mutateAsync({ id, ...data });
    setOpen(false);
  };

  const onDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
    setOpen(false);
  };

  if (!planing.isSuccess) return null;

  if (planing.data == false) {
    return (
      <button
        className="w-full h-full"
        onClick={() => filterDay.mutate({ date })}
      >
        Create new day
      </button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row w-full h-full px-4 sm:gap-6">
      <PlanningEditor
        open={open}
        onClose={onClose}
        value={editingRuleData}
        onChange={(e: unknown) => setEditingRuleData(e as PlanningItem)}
        inputs={PlanningInputs}
        onDelete={onDelete}
      />
      {planing.data.map((plan) => (
        <KanbanList
          key={plan.id}
          id={plan.id}
          title={plan.channel.name}
          rules={plan.PlanningItem}
          newTask={openTask}
        />
      ))}
    </div>
  );
};

type KanbanRule = {
  id: string;
  name: string;
  description: string;
  priority: number;
  maxMorning: number;
  maxAfternoon: number;
  maxEvening: number;
  morningAsignee: {
    id: string;
    name: string | null;
  }[];
  afternoonAsignee: {
    id: string;
    name: string | null;
  }[];
  eveningAsignee: {
    id: string;
    name: string | null;
  }[];
};

type KanbanListType = {
  id: string;
  title: string;
  rules: KanbanRule[];
  newTask: (data?: PlanningItem) => void;
};

const KanbanList = ({ id, title, rules, newTask }: KanbanListType) => (
  <div className="grow max-w-sm min-w-[16rem] bg-gray-200 rounded-lg shadow-lg mb-4 sm:mb-0">
    <h1 className="text-lg font-medium text-gray-900 pl-5 pt-3">{title}</h1>
    <div className="flex w-full flex-col gap-4 p-2 overflow-auto sm:max-h-[67vh]">
      {rules.map((rule) => (
        <KanbanItem key={rule.id} {...rule} />
      ))}
    </div>
    <button
      onClick={() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { planningId, ...data } = defaultEditingRuleData;
        newTask({
          planningId: id,
          ...data,
        });
      }}
      className="inline-flex justify-center items-center gap-1 w-full p-4 text-gray-900 font-medium"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Nieuwe taak
    </button>
  </div>
);

const KanbanItem = ({
  id,
  name,
  description,
  priority,
  maxMorning,
  maxAfternoon,
  maxEvening,
  morningAsignee,
  afternoonAsignee,
  eveningAsignee,
}: KanbanRule) => {
  const context = trpc.useContext();
  const { data, status } = useSession();
  const asigneeMuation = trpc.useMutation(['planning.asignee.add'], {
    onSuccess: () => {
      context.invalidateQueries(['planning.byDate']);
    },
  });

  const userId = data?.user?.id;

  // TODO: show a loading animation here.
  if (status !== 'authenticated' || !userId) {
    return null;
  }

  const restMorning =
    maxMorning - morningAsignee.length > 0
      ? maxMorning - morningAsignee.length
      : 1;

  const restAfternoon =
    maxAfternoon - afternoonAsignee.length > 0
      ? maxAfternoon - afternoonAsignee.length
      : 1;

  const restEvening =
    maxEvening - eveningAsignee.length > 0
      ? maxEvening - eveningAsignee.length
      : 1;

  const canMorningAsign =
    maxMorning == 0 ||
    (!morningAsignee.some((item) => item.id === userId) &&
      morningAsignee.length < maxMorning);
  const canAfternoonAsign =
    maxAfternoon == 0 ||
    (!afternoonAsignee.some((item) => item.id === userId) &&
      afternoonAsignee.length < maxAfternoon);
  const canEveningAsign =
    maxEvening == 0 ||
    (!eveningAsignee.some((item) => item.id === userId) &&
      eveningAsignee.length < maxEvening);

  return (
    <div className="bg-white rounded-md shadow-md">
      <div className="p-5">
        <div className="flex justify-between content-center tracking-tight pb-2">
          <strong className="inline-flex items-center">
            <h2 className="font-bold text-gray-900">{name}</h2>
          </strong>
          {/* TODO: Prio */}
          {priority > 0 && (
            <div className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-blue-200 text-blue-700 rounded-full">
              Prio {priority}
            </div>
          )}
        </div>
        <p>{description}</p>
        <div className="pt-2">
          <div className="flex gap-2 content-center tracking-tight my-2">
            <h2 className="font-bold text-gray-900">Ochtend</h2>
            <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-2 rounded-full">
              {morningAsignee.length} / {maxMorning > 0 ? maxMorning : '∞'}
            </span>
          </div>
          {morningAsignee.map(({ id: itemId, name }) => (
            <span
              key={itemId}
              className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full"
            >
              {name}
            </span>
          ))}

          {canMorningAsign && maxMorning > 0
            ? [...new Array(restMorning)].map((_, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={() => {
                    asigneeMuation.mutate({
                      planningItemId: id,
                      timeOfDay: 'morning',
                    });
                  }}
                  className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-dashed border-2 rounded-full"
                >
                  Leeg
                </a>
              ))
            : canMorningAsign && (
                <a
                  href="#"
                  onClick={() => {
                    asigneeMuation.mutate({
                      planningItemId: id,
                      timeOfDay: 'morning',
                    });
                  }}
                  className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-dashed border-2 rounded-full"
                >
                  Leeg
                </a>
              )}
        </div>
        <div className="pt-2">
          <div className="flex gap-2 content-center tracking-tight my-2">
            <h2 className="font-bold text-gray-900">Middag</h2>
            <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-2 rounded-full">
              {afternoonAsignee.length} /{' '}
              {maxAfternoon > 0 ? maxAfternoon : '∞'}
            </span>
          </div>
          {afternoonAsignee.map(({ id: itemId, name }) => (
            <span
              key={itemId}
              className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full"
            >
              {name}
            </span>
          ))}
          {canAfternoonAsign && maxAfternoon > 0
            ? [...new Array(restAfternoon)].map((_, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={() => {
                    asigneeMuation.mutate({
                      planningItemId: id,
                      timeOfDay: 'afternoon',
                    });
                  }}
                  className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-dashed border-2 rounded-full"
                >
                  Leeg
                </a>
              ))
            : canAfternoonAsign && (
                <a
                  href="#"
                  onClick={() => {
                    asigneeMuation.mutate({
                      planningItemId: id,
                      timeOfDay: 'afternoon',
                    });
                  }}
                  className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-dashed border-2 rounded-full"
                >
                  Leeg
                </a>
              )}
        </div>
        <div className="pt-2">
          <div className="flex gap-2 content-center tracking-tight my-2">
            <h2 className="font-bold text-gray-900">Avond</h2>
            <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-2 rounded-full">
              {eveningAsignee.length} / {maxEvening > 0 ? maxEvening : '∞'}
            </span>
          </div>
          {eveningAsignee.map(({ id: itemId, name }) => (
            <span
              key={itemId}
              className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full"
            >
              {name}
            </span>
          ))}
          {canEveningAsign && maxEvening > 0
            ? [...new Array(restEvening)].map((_, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={() => {
                    asigneeMuation.mutate({
                      planningItemId: id,
                      timeOfDay: 'evening',
                    });
                  }}
                  className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-dashed border-2 rounded-full"
                >
                  Leeg
                </a>
              ))
            : canEveningAsign && (
                <a
                  href="#"
                  onClick={() => {
                    asigneeMuation.mutate({
                      planningItemId: id,
                      timeOfDay: 'evening',
                    });
                  }}
                  className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-dashed border-2 rounded-full"
                >
                  Leeg
                </a>
              )}
        </div>
      </div>
    </div>
  );
};

export default KanbanComponent;
