import { PlanningItem } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useContext, useState } from 'react';
import { z } from 'zod';
import { inferMutationInput, inferQueryOutput, trpc } from '~/utils/trpc';
import { DateContext } from './DateLayout';
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

// TODO: find a way to infer this type.
export type KanbanRule = Exclude<
  inferQueryOutput<'planning.byDate'>,
  false
>[0]['PlanningItem'][0];
// export type KanbanRule = {
//   id: string;
//   name: string;
//   description: string;
//   ownerId: string | null;
//   priority: number;
//   maxMorning: number;
//   maxAfternoon: number;
//   maxEvening: number;
//   planningRuleId: string;
//   morningAsignee: {
//     id: string;
//     name: string | null;
//   }[];
//   afternoonAsignee: {
//     id: string;
//     name: string | null;
//   }[];
//   eveningAsignee: {
//     id: string;
//     name: string | null;
//   }[];
// };

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
    field: 'minMorning',
    label: 'Min. aantal ochtend',
    input: 'number',
    placeholder: 'Geen limiet',
  },
  {
    field: 'minAfternoon',
    label: 'Min. aantal middag',
    input: 'number',
    placeholder: 'Geen limiet',
  },
  {
    field: 'minEvening',
    label: 'Min. aantal avond',
    input: 'number',
    placeholder: 'Geen limiet',
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

type KanbanListType = {
  id: string;
  title: string;
  rules: KanbanRule[];
  newTask: (data?: inferMutationInput<'planning.tasks.upsert'>) => void;
};

const KanbanList = ({ id, title, rules, newTask }: KanbanListType) => {
  const { data: user } = useSession();

  const prioGroups = groupByKey(rules, 'priority');

  const currentPrioString = Object.keys(prioGroups).find((k) => {
    return prioGroups[k].find(
      (item: KanbanRule) =>
        item.morningAsignee.length <= item.minMorning &&
        item.afternoonAsignee.length <= item.minAfternoon &&
        item.eveningAsignee.length <= item.minEvening,
    );
  });

  const currentPrio = parseInt(currentPrioString || '0') || 0;

  return (
    <div className="grow max-w-sm min-w-[16rem] bg-gray-200 rounded-lg shadow-lg mb-4 sm:mb-0">
      <h1 className="text-lg font-medium text-gray-900 pl-5 pt-3">{title}</h1>
      <div className="flex w-full flex-col gap-4 p-2 overflow-auto sm:max-h-[67vh]">
        {rules.map((rule) => (
          <KanbanItem
            key={rule.id}
            currentPrio={currentPrio}
            editTask={newTask}
            item={rule}
          />
        ))}
      </div>
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
    </div>
  );
};

export default KanbanComponent;
