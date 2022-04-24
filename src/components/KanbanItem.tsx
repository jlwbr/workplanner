import { useSession } from 'next-auth/react';
import { inferMutationInput, trpc } from '~/utils/trpc';
import AsigneeBadge from './AsigneeBadge';
import { KanbanRule } from './KanbanComponent';

type KanbanItemType = {
  item: KanbanRule;
  currentPrio: number;
  editTask: (item: inferMutationInput<'planning.tasks.upsert'>) => void;
};

const KanbanItem = ({ item, currentPrio, editTask }: KanbanItemType) => {
  const context = trpc.useContext();
  const { data, status } = useSession();
  // FIXME: We are invalidating a lot of data all over the app, we should only invalidate the data we need to.
  const asigneeMuation = trpc.useMutation(['planning.asignee.add'], {
    onSuccess: () => {
      context.invalidateQueries(['planning.byDate']);
    },
  });

  const {
    id,
    name,
    description,
    priority,
    ownerId,
    minMorning,
    minAfternoon,
    minEvening,
    maxMorning,
    maxAfternoon,
    maxEvening,
    morningAsignee,
    afternoonAsignee,
    eveningAsignee,
  } = item;

  const userId = data?.user?.id;
  const isEditer = data?.user?.isEditor;

  // TODO: show a loading animation here.
  if (status !== 'authenticated' || !userId) {
    return null;
  }

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

  const isCorrectPrio = currentPrio == 0 || currentPrio == priority;

  const canMorningAsign =
    isCorrectPrio &&
    !morningAsignee.some((item) => item.id === userId) &&
    (maxMorning == 0 || morningAsignee.length < maxMorning) &&
    (maxMorning == 0 || morningAsignee.length < maxMorning);
  const canAfternoonAsign =
    isCorrectPrio &&
    !afternoonAsignee.some((item) => item.id === userId) &&
    (maxAfternoon == 0 || afternoonAsignee.length < maxAfternoon);
  const canEveningAsign =
    isCorrectPrio &&
    !eveningAsignee.some((item) => item.id === userId) &&
    (maxEvening == 0 || eveningAsignee.length < maxEvening);

  if (!isCorrectPrio)
    return (
      <DisabledKanbanItem
        item={item}
        canEdit={(userId === ownerId ?? isEditer) || false}
        currentPriority={currentPrio}
        editTask={editTask}
      />
    );

  return (
    <div className="bg-white rounded-md shadow-md">
      <div className="p-5">
        <div className="flex justify-between content-center tracking-tight pb-2">
          <strong className="inline-flex items-center">
            <h2 className="font-bold text-gray-900">{name}</h2>
          </strong>
          <div className="flex items-center gap-2">
            {priority > 0 && (
              <div className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-blue-200 text-blue-700 rounded-full">
                Prio {priority}
              </div>
            )}
            {(userId === ownerId || isEditer) && (
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
        <p>{description}</p>
        <div className="pt-2">
          <div className="flex gap-2 content-center tracking-tight my-2">
            <h2 className="font-bold text-gray-900">Ochtend</h2>
            {/* FIXME: we could make this more clear by using a progessbar, for example: https://tailwinduikit.com/components/webapp/UI_element/progress_bar */}
            <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-2 rounded-full">
              {morningAsignee.length} / {maxMorning > 0 ? maxMorning : '∞'}
            </span>
          </div>
          {morningAsignee.map(({ id: itemId, name }) => (
            <AsigneeBadge
              key={itemId}
              planningItemId={id}
              asigneeId={itemId}
              name={name}
              timeOfDay="morning"
              canRemove={isEditer || itemId == userId}
            />
          ))}

          {canMorningAsign &&
            [...new Array(restMorning)].map((_, i) => (
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
            ))}
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
            <AsigneeBadge
              key={itemId}
              planningItemId={id}
              name={name}
              timeOfDay="afternoon"
              canRemove={isEditer || itemId == userId}
            />
          ))}
          {canAfternoonAsign &&
            [...new Array(restAfternoon)].map((_, i) => (
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
            ))}
        </div>
        <div className="pt-2">
          <div className="flex gap-2 content-center tracking-tight my-2">
            <h2 className="font-bold text-gray-900">Avond</h2>
            <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-700 border-2 rounded-full">
              {eveningAsignee.length} / {maxEvening > 0 ? maxEvening : '∞'}
            </span>
          </div>
          {eveningAsignee.map(({ id: itemId, name }) => (
            <AsigneeBadge
              key={itemId}
              planningItemId={id}
              name={name}
              timeOfDay="evening"
              canRemove={isEditer || itemId == userId}
            />
          ))}
          {canEveningAsign &&
            [...new Array(restEvening)].map((_, i) => (
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
            ))}
        </div>
      </div>
    </div>
  );
};

type DisabledKanbanItemType = {
  item: KanbanRule;
  canEdit: boolean;
  currentPriority: number;
  editTask: (item: KanbanRule) => void;
};

const DisabledKanbanItem = ({
  item,
  canEdit,
  currentPriority,
  editTask,
}: DisabledKanbanItemType) => (
  <div className="bg-white rounded-md shadow-md">
    <div className="p-5">
      <div className="flex justify-between content-center tracking-tight pb-2">
        <strong className="inline-flex items-center">
          <h2 className="font-bold text-gray-900">{item.name}</h2>
        </strong>
        <div className="flex items-center gap-2">
          {item.priority > 0 && (
            <div className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-blue-200 text-blue-700 rounded-full">
              Prio {item.priority}
            </div>
          )}
          {canEdit && (
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
      <p>{item.description}</p>
      <div className="pt-2">
        <div className="flex content-center justify-center tracking-tight my-2">
          <div className="text-xs inline-flex items-center font-bold leading-sm px-3 py-1 bg-red-200 text-red-700 rounded-full">
            Vul eerst alle items met Prio {currentPriority} in
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default KanbanItem;
