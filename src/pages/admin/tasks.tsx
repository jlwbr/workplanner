import { Tab } from '@headlessui/react';
import { PlanningRule } from '@prisma/client';
import { ReactElement, useState } from 'react';
import { AdminLayout } from '~/components/AdminLayout';
import PlanningEditor, {
  PlanningInputsType,
} from '~/components/PlanningEditor';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

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
  maxMorning: 0,
  maxAfternoon: 0,
  maxEvening: 0,
};

const IndexPage: NextPageWithLayout = () => {
  const context = trpc.useContext();
  const RulesQuery = trpc.useQuery(['planning.rules.all']);
  const UpsertRule = trpc.useMutation(['planning.rules.upsert'], {
    onSuccess: () => {
      context.invalidateQueries(['planning.rules.all']);
    },
  });
  const deleteMutation = trpc.useMutation(['planning.rules.delete'], {
    onSuccess: () => {
      context.invalidateQueries(['planning.rules.all']);
    },
  });

  const [open, setOpen] = useState(false);
  const [editingRuleData, setEditingRuleData] = useState<PlanningRule>(
    defaultEditingRuleData,
  );

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

    const { id, ...data } = editingRuleData;

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
      field: 'maxMorning',
      label: 'Max. aantal ochtend',
      input: 'number',
    },
    {
      field: 'maxAfternoon',
      label: 'Max. aantal middag',
      input: 'number',
    },
    {
      field: 'maxEvening',
      label: 'Max. aantal avond',
      input: 'number',
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
                  <li
                    key={rule.id}
                    className="relative p-3 rounded-md hover:bg-coolGray-100"
                    onClick={() => openRule(rule)}
                  >
                    <h3 className="text-sm font-medium leading-5">
                      {rule.name}
                    </h3>

                    <a
                      href="#"
                      className={classNames(
                        'absolute inset-0 rounded-md',
                        'focus:z-10 focus:outline-none focus:ring-2 ring-blue-400',
                      )}
                    />
                  </li>
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

export default IndexPage;
