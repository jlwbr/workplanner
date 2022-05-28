import { PlanningItem } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { z } from 'zod';
import { inferMutationInput, inferQueryOutput, trpc } from '~/utils/trpc';
import KanbanItem from './KanbanItem';
import PlanningEditor, { PlanningInputsType } from './PlanningEditor';

const groupByKey = (list: any[], key: string) =>
  list.reduce(
    (hash, obj) => ({
      ...hash,
      [obj[key]]: (hash[obj[key]] || []).concat(obj),
    }),
    {},
  );

export type KanbanRule = Exclude<
  inferQueryOutput<'planning.byDate'>,
  false
>[0]['PlanningItem'][0];

const defaultEditingRuleData: inferMutationInput<'planning.tasks.upsert'> = {
  id: '',
  name: '',
  ownerId: '',
  priority: 0,
  description: '',
  minMorning: 0,
  minAfternoon: 0,
  minEvening: 0,
  maxMorning: 0,
  maxAfternoon: 0,
  maxEvening: 0,
  planningId: '',
};

const PlanningInputs: PlanningInputsType = [
  {
    field: 'name',
    label: 'Taak',
    input: 'text',
  },
  {
    field: 'description',
    label: 'Beschrijving',
    input: 'textarea',
  },
];

type KanbanComponentType = {
  date: Date;
  isAdmin: boolean;
};

const KanbanComponent = ({ date, isAdmin }: KanbanComponentType) => {
  const context = trpc.useContext();
  const planing = trpc.useQuery([
    'planning.byDate',
    {
      date: date,
    },
  ]);
  const schedule = trpc.useQuery(
    [
      'schedule.getAll',
      {
        date: date,
      },
    ],
    {
      enabled: isAdmin,
    },
  );
  const Break = trpc.useQuery(['break.getAll', { date }], {
    enabled: planing.data?.some((item) => item.locked),
  });
  const Communication = trpc.useQuery(['communication.getAll', { date }], {
    enabled: planing.data?.some((item) => item.locked),
  });

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
  const [editingRuleData, setEditingRuleData] = useState<
    inferMutationInput<'planning.tasks.upsert'>
  >(defaultEditingRuleData);

  const openTask = (data?: inferMutationInput<'planning.tasks.upsert'>) => {
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

    // TODO: find a way to infer this from the server
    const input = z.object({
      id: z.string().optional(),
      planningId: z.string().nonempty(),
      name: z.string().nonempty(),
      ownerId: z.string().nullable().optional(),
      description: z.string().optional(),
      priority: z.number().nonnegative().optional(),
      minMorning: z.number().nonnegative().optional(),
      minAfternoon: z.number().nonnegative().optional(),
      minEvening: z.number().nonnegative().optional(),
      maxMorning: z.number().nonnegative().optional(),
      maxAfternoon: z.number().nonnegative().optional(),
      maxEvening: z.number().nonnegative().optional(),
    });

    if (input.safeParse(editingRuleData).success === false) {
      alert('Niet alle velden zijn ingevuld');
      return;
    }

    await UpsertRule.mutateAsync(editingRuleData);
    setOpen(false);
  };

  const onDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
    setOpen(false);
  };

  if (!planing.isSuccess)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <svg
          className="animate-spin -ml-1 mr-3 h-20 w-20 text-white"
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

  return (
    <div className="overflow-x-scroll">
      <div className="flex h-full px-4 gap-6 pb-2">
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
            locked={plan.locked}
            title={plan.channel.name}
            rules={plan.PlanningItem}
            schedule={schedule.data}
            Break={Break.data}
            Communication={Communication.data}
            isAdmin={isAdmin}
            newTask={openTask}
          />
        ))}
        <div className="w-0 h-full">&nbsp;</div>
      </div>
    </div>
  );
};

type KanbanListType = {
  id: string;
  title: string;
  rules: KanbanRule[];
  locked: boolean;
  isAdmin: boolean;
  Break?: inferQueryOutput<'break.getAll'>;
  Communication?: inferQueryOutput<'communication.getAll'>;
  schedule?: inferQueryOutput<'schedule.getAll'>;
  newTask: (data?: inferMutationInput<'planning.tasks.upsert'>) => void;
};

const KanbanList = ({
  id,
  title,
  rules,
  locked,
  isAdmin,
  Break,
  Communication,
  schedule,
  newTask,
}: KanbanListType) => {
  const { data: user } = useSession();
  const prioGroups = groupByKey(rules, 'priority');

  const currentPrioString = Object.keys(prioGroups).find((k) => {
    return prioGroups[k].find(
      (item: KanbanRule) =>
        item.priority !== 0 &&
        (item.morningAsignee.length < item.minMorning ||
          item.afternoonAsignee.length < item.minAfternoon ||
          item.eveningAsignee.length < item.minEvening),
    );
  });

  const currentPrio = parseInt(currentPrioString || '0') || 0;

  return (
    <div className="bg-gray-200 rounded-lg shadow-lg min-w-[calc(100vw_-_2rem)] w-[calc(100vw_-_2rem)] sm:min-w-[22rem] sm:w-[22rem]">
      <h1 className="text-lg font-medium text-gray-900 pl-5 pt-3">{title}</h1>
      <div className="flex flex-col gap-4 p-2 h-[80vh] overflow-y-auto">
        {rules.map((rule) => (
          <KanbanItem
            key={rule.id}
            currentPrio={currentPrio}
            editTask={newTask}
            item={rule}
            Break={Break}
            Communication={Communication}
            schedule={schedule}
            locked={locked}
            isAdmin={isAdmin}
          />
        ))}
      </div>
      {!locked && (
        <button
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { planningId, ownerId, ...data } = defaultEditingRuleData;
            newTask({
              ownerId: user?.user?.id || '',
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nieuwe taak
        </button>
      )}
    </div>
  );
};

export default KanbanComponent;
