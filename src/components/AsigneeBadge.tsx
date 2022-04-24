import { trpc } from '~/utils/trpc';

type AsigneeBadgeType = {
  planningItemId: string;
  asigneeId?: string;
  name: string | null;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  canRemove: boolean;
};

const AsigneeBadge = ({
  planningItemId,
  name,
  timeOfDay,
  asigneeId,
  canRemove,
}: AsigneeBadgeType) => {
  return canRemove
    ? removableAsigneeBadge({ planningItemId, name, asigneeId, timeOfDay })
    : staticAsigneeBadge({ planningItemId, name, asigneeId, timeOfDay });
};

type AsigneeBadgeSubType = {
  planningItemId: string;
  name: string | null;
  asigneeId?: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
};

const staticAsigneeBadge = ({ name }: AsigneeBadgeSubType) => (
  <div className="text-xs inline-flex items-center font-bold leading-sm px-3 py-1 bg-lime-200 text-lime-700 rounded-full">
    {name}
  </div>
);

const removableAsigneeBadge = ({
  planningItemId,
  name,
  timeOfDay,
  asigneeId,
}: AsigneeBadgeSubType) => {
  const context = trpc.useContext();
  const removableAsignee = trpc.useMutation(['planning.asignee.remove'], {
    onSuccess: () => {
      context.invalidateQueries(['planning.byDate']);
    },
  });
  return (
    <button
      onClick={() => {
        removableAsignee.mutate({
          planningItemId,
          timeOfDay,
          asigneeId,
        });
      }}
      className="text-xs inline-flex items-center justify-center gap-1 font-bold leading-sm px-3 py-1 bg-lime-200 text-lime-700 hover:bg-red-200 hover:text-red-700 rounded-full"
    >
      {name}
    </button>
  );
};

export default AsigneeBadge;
