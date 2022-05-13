import { Tab } from '@headlessui/react';
import { PlanningRule } from '@prisma/client';
import { ReactElement, useState } from 'react';
import { z } from 'zod';
import { AdminLayout } from '~/components/AdminLayout';
import PlanningEditor, {
  PlanningInputsType,
} from '~/components/PlanningEditor';
import { NextPageWithLayout } from '~/pages/_app';
import { inferMutationInput, trpc } from '~/utils/trpc';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const defaultEditingRuleData: PlanningRule = {
  id: '',
  name: '',
  priority: 0,
  description: '',
  rule: '',
  channelId: '',
  minMorning: 0,
  minAfternoon: 0,
  minEvening: 0,
  maxMorning: 0,
  maxAfternoon: 0,
  maxEvening: 0,
};

const IndexPage: NextPageWithLayout = () => {
  const context = trpc.useContext();
  const options = {
    onSuccess: () => {
      context.invalidateQueries(['planning.rules.all']);
    },
  };
  const RulesQuery = trpc.useQuery(['planning.rules.all']);
  const checkMutation = trpc.useMutation(['prolog.Check']);
  const addSubTaskMutation = trpc.useMutation(
    ['planning.rules.addSubTask'],
    options,
  );
  const editSubTaskMutation = trpc.useMutation(
    ['planning.rules.editSubTask'],
    options,
  );
  const removeSubTaskMutation = trpc.useMutation(
    ['planning.rules.removeSubTask'],
    options,
  );
  const UpsertRule = trpc.useMutation(['planning.rules.upsert'], options);
  const deleteMutation = trpc.useMutation(['planning.rules.delete'], options);

  const [open, setOpen] = useState(false);
  const [editingRuleData, setEditingRuleData] = useState<
    inferMutationInput<'planning.rules.upsert'>
  >(defaultEditingRuleData);

  const openRule = (data?: PlanningRule) => {
    if (data) {
      setEditingRuleData(data);
    } else {
      setEditingRuleData(defaultEditingRuleData);
    }
    setOpen(true);
  };

  const onRuleClose = async (cancel?: boolean) => {
    if (cancel) {
      setOpen(false);
      return;
    }

    // TODO: find a way to infer this from the server
    const input = z.object({
      id: z.string().optional(),
      planningId: z.string().nonempty().optional(),
      name: z.string().nonempty(),
      rule: z.string().nonempty(),
      ownerId: z.string().nullable().optional(),
      channelId: z.string().nonempty(),
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

    const result = await checkMutation.mutateAsync(editingRuleData.rule);

    if (!result.success) {
      alert('Syntax error!');
      return;
    }

    await UpsertRule.mutateAsync(editingRuleData);
    setOpen(false);
  };

  const onAddSubTask = async (planningRuleId: string) => {
    const name = prompt('Naam van de subtaak');

    if (!name) {
      return;
    }

    await addSubTaskMutation.mutateAsync({ planningRuleId, name });
  };

  const editSubTask = async (id: string, currentName: string) => {
    const name = prompt('Naam van de subtaak', currentName);

    if (!name) {
      return;
    }

    await editSubTaskMutation.mutateAsync({ id, name });
  };

  const onDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
    setOpen(false);
  };

  // TODO: find a more typescript friendly way to do this
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
      field: 'rule',
      label: 'Regel',
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
    {
      field: 'channelId',
      label: 'Kanaal',
      input: 'select',
      values: () =>
        RulesQuery.data
          ? RulesQuery.data.map(({ id, name }) => ({
              id,
              name,
            }))
          : [],
    },
  ];

  // FIXME: Better loading page
  if (!RulesQuery.isSuccess) return null;

  return (
    <div className="w-full px-2 sm:px-0">
      <PlanningEditor
        open={open}
        onClose={onRuleClose}
        value={editingRuleData}
        onChange={(e: unknown) => setEditingRuleData(e as PlanningRule)}
        inputs={PlanningInputs}
        onDelete={onDelete}
      />
      <Tab.Group>
        <Tab.List className="flex p-1 space-x-1 bg-blue-900/90 rounded-xl">
          {RulesQuery.data.map(({ id, name }) => (
            <Tab
              key={id}
              className={({ selected }) =>
                classNames(
                  'w-full py-2.5 text-sm leading-5 font-medium text-blue-700 rounded-lg',
                  'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60',
                  selected
                    ? 'bg-white shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
                )
              }
            >
              {name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {RulesQuery.data.map(({ PlanningRule }, idx) => (
            <Tab.Panel
              key={idx}
              className={classNames(
                'bg-white rounded-xl p-3',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60',
              )}
            >
              <ul>
                {PlanningRule.map((rule) => (
                  <div key={rule.id}>
                    <li className="relative flex justify-between p-3 rounded-md">
                      <h3 className="text-sm font-medium leading-5">
                        {rule.name}
                      </h3>

                      <div className="flex items-center gap-4">
                        <button onClick={() => onAddSubTask(rule.id)}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"
                            />
                          </svg>
                        </button>

                        <button onClick={() => openRule(rule)}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </div>
                    </li>
                    {rule.subTask &&
                      rule.subTask.map((subTask) => (
                        <li
                          key={subTask.id}
                          className="relative flex justify-between p-3 rounded-md"
                        >
                          <h3 className="text-sm font-medium leading-5 pl-5">
                            {subTask.name}
                          </h3>

                          <div className="flex items-center gap-4">
                            <button
                              onClick={() =>
                                editSubTask(subTask.id, subTask.name)
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>

                            <button
                              onClick={() =>
                                removeSubTaskMutation.mutateAsync({
                                  id: subTask.id,
                                })
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                  </div>
                ))}
              </ul>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
      <button
        onClick={() => openRule()}
        className="fixed right-4 bottom-4 text-white px-4 w-auto h-10 bg-red-600 rounded-full hover:bg-red-700 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
      >
        <svg
          viewBox="0 0 20 20"
          enableBackground="new 0 0 20 20"
          className="w-6 h-6 inline-block mr-1"
        >
          <path
            fill="#FFFFFF"
            d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601
                                    C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399
                                    C15.952,9,16,9.447,16,10z"
          />
        </svg>
        <span>Nieuw</span>
      </button>
    </div>
  );
};

IndexPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;
IndexPage.requireAuth = true;

export default IndexPage;
