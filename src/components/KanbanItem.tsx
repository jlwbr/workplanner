import { useSession } from 'next-auth/react';
import { inferMutationInput, trpc } from '~/utils/trpc';
import { KanbanRule } from './KanbanComponent';

type KanbanItemType = {
  item: KanbanRule;
  editTask: (item: inferMutationInput<'planning.tasks.upsert'>) => void;
};

const KanbanItem = ({ item, editTask }: KanbanItemType) => {
  const context = trpc.useContext();
  const { data, status } = useSession();
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
    !morningAsignee.some((item) => item.id === userId) &&
    (maxMorning == 0 || morningAsignee.length < maxMorning);
  const canAfternoonAsign =
    !afternoonAsignee.some((item) => item.id === userId) &&
    (maxAfternoon == 0 || afternoonAsignee.length < maxAfternoon);
  const canEveningAsign =
    !eveningAsignee.some((item) => item.id === userId) &&
    (maxEvening == 0 || eveningAsignee.length < maxEvening);

  return (
    <div className="bg-white rounded-md shadow-md">
      <div className="p-5">
        <div className="flex justify-between content-center tracking-tight pb-2">
          <strong className="inline-flex items-center">
            <h2 className="font-bold text-gray-900">{name}</h2>
          </strong>
          {/* TODO: Prio */}
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

export default KanbanItem;
