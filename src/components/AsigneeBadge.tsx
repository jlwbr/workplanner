import { useDrag } from 'react-dnd';
import { trpc } from '~/utils/trpc';

type AsigneeBadgeType = {
  planningItemId?: string;
  asigneeId?: string;
  name: string | null;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  used?: number;
  canRemove: boolean;
  draggable?: boolean;
};

export const ItemTypes = {
  BADGE: 'badge',
};

const AsigneeBadge = ({
  planningItemId,
  name,
  timeOfDay,
  asigneeId,
  canRemove,
  draggable,
  used,
}: AsigneeBadgeType) => {
  const [, drag] = useDrag(() => ({
    type: ItemTypes.BADGE,
    item: { id: asigneeId },
    canDrag: draggable === true,
  }));

  return (
    <div ref={drag}>
      {canRemove
        ? removableAsigneeBadge({
            planningItemId,
            name,
            asigneeId,
            timeOfDay,
            used,
          })
        : staticAsigneeBadge({
            planningItemId,
            name,
            asigneeId,
            timeOfDay,
            used,
          })}
    </div>
  );
};

type AsigneeBadgeSubType = {
  planningItemId?: string;
  name: string | null;
  asigneeId?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  used?: number;
};

const staticAsigneeBadge = ({ name, used }: AsigneeBadgeSubType) => {
  const color = () => {
    switch (used) {
      case 1:
        return 'bg-orange-200 text-orange-700';
      case 2:
        return 'bg-blue-200 text-blue-700';
      case 3:
        return 'bg-lime-200 text-lime-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div
      className={`text-xs inline-flex items-center font-bold leading-sm px-3 py-1 ${color()} rounded-full whitespace-nowrap`}
    >
      {name}
    </div>
  );
};

const removableAsigneeBadge = ({
  planningItemId,
  name,
  timeOfDay,
  asigneeId,
  used,
}: AsigneeBadgeSubType) => {
  const context = trpc.useContext();
  const removableAsignee = trpc.useMutation(['planning.asignee.remove'], {
    onSuccess: () => {
      context.invalidateQueries(['planning.byDate']);
    },
  });

  if (!planningItemId || !timeOfDay) return null;

  const color = () => {
    switch (used) {
      case 1:
        return 'bg-orange-200 text-orange-700';
      case 2:
        return 'bg-blue-200 text-blue-700';
      case 3:
        return 'bg-lime-200 text-lime-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <button
      onClick={() => {
        removableAsignee.mutate({
          planningItemId,
          timeOfDay,
          asigneeId,
        });
      }}
      className={`text-xs inline-flex items-center font-bold leading-sm px-3 py-1 ${color()} rounded-full whitespace-nowrap`}
    >
      {name}
    </button>
  );
};

export { staticAsigneeBadge as StaticAsigneeBadge };
export default AsigneeBadge;
