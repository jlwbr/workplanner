import { useSession } from 'next-auth/react';
import ReactTooltip from 'react-tooltip';
import { inferMutationInput, trpc } from '~/utils/trpc';
import AsigneeBadge, { ItemTypes } from './AsigneeBadge';
import { KanbanRule } from './KanbanComponent';
import { inferQueryOutput } from '~/utils/trpc';
import { useDrop } from 'react-dnd';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Prisma } from '@prisma/client';
import Select, { MultiValue } from 'react-select';

type KanbanItemType = {
  item: KanbanRule;
  locked: boolean;
  isAdmin: boolean;
  Break?: inferQueryOutput<'break.getAll'>;
  Communication?: inferQueryOutput<'communication.getAll'>;
  schedule?: inferQueryOutput<'schedule.getAll'>;
  editTask: (item: inferMutationInput<'planning.tasks.upsert'>) => void;
};

type assigneeType = {
  id: string;
  asignees: KanbanRule['morningAsignee'];
  canAssign: boolean;
  userId: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  isAdmin: boolean;
  Break?: inferQueryOutput<'break.getAll'>;
  Communication?: inferQueryOutput<'communication.getAll'>;
  locked: boolean;
  rest: number;
};

const Assignees = ({
  id,
  asignees,
  canAssign,
  userId,
  timeOfDay,
  isAdmin,
  Break,
  Communication,
  locked,
  rest,
}: assigneeType) => {
  const context = trpc.useContext();
  const [assignees, setAssignees] = useState(
    asignees.map((item) => ({
      value: item.id,
      label: item.name,
    })),
  );
  const asigneeMuation = trpc.useMutation(['planning.asignee.add'], {
    onSuccess: () => {
      context.invalidateQueries(['planning.byDate']);
    },
  });
  const removeAsignee = trpc.useMutation(['planning.asignee.remove'], {
    onSuccess: () => {
      context.invalidateQueries(['planning.byDate']);
    },
  });

  const userQuery = trpc.useQuery(['user.all'], {
    enabled: isAdmin,
  });
  const options = userQuery.data?.map((user) => ({
    value: user.id,
    label: user.name || `Anoniem (${user.id.slice(0, 4)})`,
  }));

  const handleChange = (
    selectedOption: MultiValue<{ value: string; label: string | null }>,
  ) => {
    setAssignees(selectedOption.concat());
    for (const option of selectedOption) {
      if (!asignees.some((asignee) => asignee.id == option.value)) {
        asignees.shift();
        asigneeMuation.mutate({
          planningItemId: id,
          timeOfDay,
          asigneeId: option.value,
        });
      }
    }

    for (const asignee of asignees) {
      removeAsignee.mutate({
        planningItemId: id,
        timeOfDay,
        asigneeId: asignee.id,
      });
    }
  };

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.BADGE,
    drop: (item: { id: string }) => {
      const option = options?.find((i) => i.value == item.id);
      if (option) setAssignees([...assignees, option]);
      asigneeMuation.mutate({
        planningItemId: id,
        timeOfDay,
        asigneeId: item.id,
      });
    },
  }));

  return isAdmin && !locked ? (
    <div ref={drop}>
      <Select
        options={options}
        value={assignees}
        onChange={(c) => handleChange(c)}
        menuPortalTarget={document.body}
        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
        placeholder="Typen om te zoeken..."
        isMulti
        isSearchable
      />
    </div>
  ) : (
    <div ref={drop} className="flex flex-wrap gap-2">
      {asignees.map(({ id: itemId, name }) => {
        const phone = Communication?.find(
          ({ userId }) => userId === itemId,
        )?.phoneNumber;
        const br = Break?.find(({ userId }) => userId === itemId)?.number;
        return (
          <div key={itemId}>
            <AsigneeBadge
              planningItemId={id}
              asigneeId={itemId}
              name={
                !locked
                  ? name
                  : `${name}  ${phone || br ? '(' : ''}${
                      (typeof phone == 'string' && phone) || ''
                    }${
                      (typeof phone == 'string' && typeof br == 'number'
                        ? '/'
                        : '') || ''
                    }${(typeof br == 'number' && `p${br}`) || ''}${
                      phone || br ? ')' : ''
                    }`
              }
              timeOfDay={timeOfDay}
              canRemove={!locked && (isAdmin || itemId == userId)}
            />
          </div>
        );
      })}
      {canAssign &&
        [...new Array(rest)].map((_, i) => (
          <div
            key={i}
            onClick={() => {
              asigneeMuation.mutate({
                planningItemId: id,
                timeOfDay,
              });
            }}
            className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-gray-700 border-dashed border-2 rounded-full cursor-pointer"
          >
            Leeg
          </div>
        ))}
    </div>
  );
};

const KanbanItem = ({
  item,
  Break,
  Communication,
  locked,
  isAdmin,
  editTask,
}: KanbanItemType) => {
  const context = trpc.useContext();
  const { data, status } = useSession();
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
  const AssigneeTextMutation = trpc.useMutation(
    ['planning.tasks.AssigneeText'],
    {
      onSuccess: () => {
        context.invalidateQueries(['planning.byDate']);
      },
    },
  );
  const [open, setOpen] = useState(false);

  const {
    id,
    name,
    description,
    ownerId,
    done,
    doneUser,
    minMorning,
    minAfternoon,
    minEvening,
    maxMorning,
    maxAfternoon,
    maxEvening,
    AssigneeText,
    morningAsignee,
    afternoonAsignee,
    eveningAsignee,
    hasMorning,
    hasAfternoon,
    hasEvening,
  } = item;

  const userId = data?.user?.id;
  const isEditer = data?.user?.isEditor;

  // TODO: show a loading animation here.
  if (status !== 'authenticated' || !userId) {
    return null;
  }

  const updateAssigneeText = (oldText?: string) => {
    const text = prompt('Beschrijving', oldText) || '';

    toast.promise(
      AssigneeTextMutation.mutateAsync({
        id,
        text,
      }),
      {
        loading: 'Beschrijving aan het aanpassen',
        error: 'Er is iets fout gegaan',
        success: 'Beschrijving is aangepast',
      },
    );
  };

  const users = [
    ...morningAsignee,
    ...afternoonAsignee,
    ...eveningAsignee,
  ].filter(
    (value, index, self) => index === self.findIndex((t) => t.id === value.id),
  );

  const willUseMaxMorning =
    maxMorning - morningAsignee.length > 0 ? true : false;
  const willUseMaxAfternoon =
    maxAfternoon - afternoonAsignee.length > 0 ? true : false;
  const willUseMaxEvening =
    maxEvening - eveningAsignee.length > 0 ? true : false;

  const willUseMinMorning =
    minMorning - morningAsignee.length > 0 ? true : false;
  const willUseMinAfternoon =
    minAfternoon - afternoonAsignee.length > 0 ? true : false;
  const willUseMinEvening =
    minEvening - eveningAsignee.length > 0 ? true : false;

  const restMorning = willUseMaxMorning
    ? maxMorning - morningAsignee.length
    : willUseMinMorning
    ? minMorning - morningAsignee.length
    : 1;
  const restAfternoon = willUseMaxAfternoon
    ? maxAfternoon - afternoonAsignee.length
    : willUseMinAfternoon
    ? minAfternoon - afternoonAsignee.length
    : 1;
  const restEvening = willUseMaxEvening
    ? maxEvening - eveningAsignee.length
    : willUseMinEvening
    ? minEvening - eveningAsignee.length
    : 1;

  const canMorningAsign =
    !locked &&
    (isAdmin || !morningAsignee.some((item) => item.id === userId)) &&
    (maxMorning == 0 || morningAsignee.length < maxMorning) &&
    (maxMorning == 0 || morningAsignee.length < maxMorning);
  const canAfternoonAsign =
    !locked &&
    (isAdmin || !afternoonAsignee.some((item) => item.id === userId)) &&
    (maxAfternoon == 0 || afternoonAsignee.length < maxAfternoon);
  const canEveningAsign =
    !locked &&
    (isAdmin || !eveningAsignee.some((item) => item.id === userId)) &&
    (maxEvening == 0 || eveningAsignee.length < maxEvening);

  const canAddAssigneeText =
    morningAsignee.findIndex((item) => item.id === userId) > -1 ||
    afternoonAsignee.findIndex((item) => item.id === userId) > -1 ||
    eveningAsignee.findIndex((item) => item.id === userId) > -1;
  return (
    <div className="bg-white rounded-md shadow-md">
      <ReactTooltip />
      <div className="p-5">
        <div className="flex justify-between content-center tracking-tight pb-2">
          <strong className="inline-flex items-center gap-2">
            <div
              data-tip={
                doneUser
                  ? `${doneUser.name} heeft deze taak afgerond`
                  : 'Deze taak is nog niet afgerond'
              }
              className="text-xs inline-flex items-center font-bold leading-sm uppercase px-2 py-1 bg-orange-200 text-orange-700 rounded-full"
            >
              <input
                type="checkbox"
                checked={done}
                disabled={
                  doneMutation.status !== 'idle' &&
                  doneMutation.status !== 'success'
                }
                onChange={() => doneMutation.mutateAsync({ id, done: !!!done })}
              />
            </div>
            <h2 className="font-bold text-gray-900">{name}</h2>
          </strong>
          <div className="flex items-center gap-2">
            {canAddAssigneeText && (
              <button
                onClick={() =>
                  updateAssigneeText(
                    AssigneeText && typeof AssigneeText === 'object'
                      ? ((AssigneeText as Prisma.JsonObject)[userId] as string)
                      : undefined,
                  )
                }
                className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-red-200 text-red-700 rounded-full"
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
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </button>
            )}
            {(userId === ownerId || isEditer) && !locked && (
              <button
                onClick={() => editTask(item)}
                className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-purple-200 text-purple-700 rounded-full"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="whitespace-pre-wrap">{description}</div>
        <div className="whitespace-pre-wrap">
          {users.map(({ id, name }) => {
            if (AssigneeText && typeof AssigneeText === 'object') {
              const text = (AssigneeText as Prisma.JsonObject)[id];
              return text ? (
                <div key={id}>
                  {name?.split(' ')[0]}: {text}
                </div>
              ) : null;
            }

            return null;
          })}
        </div>
        {item.subTask.length > 0 && (
          <div className="pt-2">
            <div className="flex gap-1 items-baseline justify-between">
              <h2 className="font-bold">Subtaken</h2>
              <button
                onClick={() =>
                  subTaskFinishAllMutation.mutateAsync({ id, done: true })
                }
                className="text-xs text-gray-600"
              >
                Alles afronden
              </button>
            </div>
            <ul className="flex flex-col">
              {open &&
                item.subTask.map((subTask) => (
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
                        (subTaskdoneMutation.status !== 'idle' &&
                          subTaskdoneMutation.status !== 'success') ||
                        (subTaskFinishAllMutation.status !== 'idle' &&
                          subTaskFinishAllMutation.status !== 'success')
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
            </ul>
            <div className="w-full flex justify-center">
              <button
                className="text-xs inline-flex items-center font-bold leading-sm px-3 py-1 bg-gray-200 text-gray-700 rounded-full whitespace-nowrap"
                onClick={() => setOpen(!open)}
              >
                {open ? (
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
          </div>
        )}
        {hasMorning && (
          <div className="pt-2">
            <div className="flex gap-2 content-center tracking-tight my-2">
              <h2 className="font-bold text-gray-900">Ochtend</h2>
              {/* FIXME: we could make this more clear by using a progessbar, for example: https://tailwinduikit.com/components/webapp/UI_element/progress_bar */}
              <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-2 rounded-full">
                {morningAsignee.length} / {maxMorning > 0 ? maxMorning : '∞'}
              </span>
            </div>
            <Assignees
              id={id}
              asignees={morningAsignee}
              canAssign={canMorningAsign}
              userId={userId}
              Break={Break}
              Communication={Communication}
              locked={locked}
              isAdmin={isAdmin}
              timeOfDay="morning"
              rest={restMorning}
            />
          </div>
        )}
        {hasAfternoon && (
          <div className="pt-2">
            <div className="flex gap-2 content-center tracking-tight my-2">
              <h2 className="font-bold text-gray-900">Middag</h2>
              <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-2 rounded-full">
                {afternoonAsignee.length} /{' '}
                {maxAfternoon > 0 ? maxAfternoon : '∞'}
              </span>
            </div>
            <Assignees
              id={id}
              asignees={afternoonAsignee}
              canAssign={canAfternoonAsign}
              userId={userId}
              Break={Break}
              Communication={Communication}
              locked={locked}
              isAdmin={isAdmin}
              timeOfDay="afternoon"
              rest={restAfternoon}
            />
          </div>
        )}
        {hasEvening && (
          <div className="pt-2">
            <div className="flex gap-2 content-center tracking-tight my-2">
              <h2 className="font-bold text-gray-900">Avond</h2>
              <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-2 rounded-full">
                {eveningAsignee.length} / {maxEvening > 0 ? maxEvening : '∞'}
              </span>
            </div>
            <Assignees
              id={id}
              asignees={eveningAsignee}
              canAssign={canEveningAsign}
              userId={userId}
              Break={Break}
              Communication={Communication}
              locked={locked}
              isAdmin={isAdmin}
              timeOfDay="evening"
              rest={restEvening}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanItem;
