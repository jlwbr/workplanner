import { PlanningItem } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { z } from 'zod';
import swallowQuery from '~/utils/swallowQuery';
import { InferMutationInput, InferQueryOutput, trpc } from '~/utils/trpc';
import KanbanItem from './KanbanItem';
import PlanningEditor, { PlanningInputsType } from './PlanningEditor';

export type KanbanRule = Exclude<
  InferQueryOutput<'planning.byDate'>,
  false
>[0]['PlanningItem'][0];

const defaultEditingRuleData: InferMutationInput<'planning.tasks.upsert'> = {
  id: '',
  name: '',
  ownerId: '',
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
  const rowQuery = trpc.useQuery([
    'planning.rows',
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
    enabled: rowQuery.data?.some((item) => item.locked),
  });
  const Communication = trpc.useQuery(['communication.getAll', { date }], {
    enabled: rowQuery.data?.some((item) => item.locked),
  });

  const UpsertRule = trpc.useMutation(['planning.tasks.upsert'], {
    onSuccess: () => {
      // context.invalidateQueries(['planning.byDate']);
    },
  });
  const deleteMutation = trpc.useMutation(['planning.tasks.delete'], {
    onSuccess: () => {
      // context.invalidateQueries(['planning.byDate']);
    },
  });
  const [open, setOpen] = useState(false);
  const [editingRuleData, setEditingRuleData] = useState<
    InferMutationInput<'planning.tasks.upsert'>
  >(defaultEditingRuleData);

  const openTask = (data?: InferMutationInput<'planning.tasks.upsert'>) => {
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
    if (confirm('Weet je zeker dat je deze taak wilt verwijderen?')) {
      await deleteMutation.mutateAsync({ id });
      setOpen(false);
    }
  };

  const [rows, success, element] = swallowQuery(rowQuery);
  if (!success) return element;

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
        {rows.map(({ id, channel, locked }) => (
          <KanbanList
            key={id}
            planning={id}
            locked={locked}
            canAdd={channel.canAdd}
            title={channel.name}
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
  planning: string;
  title: string;
  locked: boolean;
  isAdmin: boolean;
  canAdd: boolean;
  Break?: InferQueryOutput<'break.getAll'>;
  Communication?: InferQueryOutput<'communication.getAll'>;
  schedule?: InferQueryOutput<'schedule.getAll'>;
  newTask: (data?: InferMutationInput<'planning.tasks.upsert'>) => void;
};

const KanbanList = ({
  planning,
  title,
  locked,
  isAdmin,
  canAdd,
  Break,
  Communication,
  schedule,
  newTask,
}: KanbanListType) => {
  const { data: user } = useSession();
  const rulesQuery = trpc.useQuery(['planning.rules', { planning }]);

  const [rules, success, element] = swallowQuery(rulesQuery);
  if (!success) return element;

  return (
    <div className="bg-gray-200 rounded-lg shadow-lg min-w-[calc(100vw_-_2rem)] w-[calc(100vw_-_2rem)] sm:min-w-[22rem] sm:w-[22rem]">
      <h1 className="text-lg font-medium text-gray-900 pl-5 pt-3">{title}</h1>
      <div className="flex flex-col gap-4 p-2 h-[80vh] overflow-y-auto">
        {rules.map(({ id }) => (
          <KanbanItem
            key={id}
            editTask={newTask}
            item={id}
            Break={Break}
            Communication={Communication}
            schedule={schedule}
            locked={locked}
            isAdmin={isAdmin}
          />
        ))}
      </div>
      {!locked && (isAdmin || canAdd) && (
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
