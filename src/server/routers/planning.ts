import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { GeneratePlanning } from './prolog';

/**
 * Default selector for Tasks.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const defaultTaskSelect = Prisma.validator<Prisma.PlanningSelect>()({
  id: true,
  date: true,
  locked: true,
  channel: {
    select: {
      name: true,
      sort: true,
      canAdd: true,
    },
  },
  PlanningItem: {
    select: {
      id: true,
      name: true,
      ownerId: true,
      planningId: true,
      description: true,
      minMorning: true,
      minAfternoon: true,
      minEvening: true,
      maxMorning: true,
      maxAfternoon: true,
      maxEvening: true,
      hasMorning: true,
      hasAfternoon: true,
      important: true,
      hasEvening: true,
      done: true,
      AssigneeText: true,
      PlanningRule: {
        select: {
          order: true,
        },
      },
      subTask: {
        select: {
          id: true,
          name: true,
          done: true,
          doneUser: true,
        },
      },
      doneUser: {
        select: {
          id: true,
          name: true,
        },
      },
      morningAsignee: {
        select: {
          id: true,
          name: true,
        },
      },
      afternoonAsignee: {
        select: {
          id: true,
          name: true,
        },
      },
      eveningAsignee: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
});

export const planningRouter = createRouter()
  .mutation('asignee.add', {
    input: z.object({
      planningItemId: z.string().cuid(),
      asigneeId: z.string().cuid().optional(),
      timeOfDay: z.enum(['morning', 'afternoon', 'evening']),
    }),
    async resolve({ input, ctx }) {
      const { planningItemId, timeOfDay, asigneeId } = input;
      if (
        asigneeId &&
        asigneeId !== ctx.session?.user?.id &&
        !ctx.session?.user?.isEditor
      ) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      const id = asigneeId ?? ctx.session?.user?.id;

      switch (timeOfDay) {
        case 'morning':
          return await prisma.planningItem.update({
            where: { id: planningItemId },
            data: {
              morningAsignee: {
                connect: { id },
              },
            },
          });
        case 'afternoon':
          return await prisma.planningItem.update({
            where: { id: planningItemId },
            data: {
              afternoonAsignee: {
                connect: { id },
              },
            },
          });
        case 'evening':
          return await prisma.planningItem.update({
            where: { id: planningItemId },
            data: {
              eveningAsignee: {
                connect: { id },
              },
            },
          });
        default:
          throw new TRPCError({
            code: 'PARSE_ERROR',
            message: 'Invalid time of day',
          });
      }
    },
  })
  .mutation('asignee.remove', {
    input: z.object({
      planningItemId: z.string().cuid(),
      asigneeId: z.string().cuid().optional(),
      timeOfDay: z.enum(['morning', 'afternoon', 'evening']),
    }),
    async resolve({ input, ctx }) {
      const { planningItemId, timeOfDay, asigneeId } = input;
      if (
        asigneeId &&
        asigneeId !== ctx.session?.user?.id &&
        !ctx.session?.user?.isEditor
      ) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      const id = asigneeId ?? ctx.session?.user?.id;

      switch (timeOfDay) {
        case 'morning':
          return await prisma.planningItem.update({
            where: { id: planningItemId },
            data: {
              morningAsignee: {
                disconnect: { id },
              },
            },
          });
        case 'afternoon':
          return await prisma.planningItem.update({
            where: { id: planningItemId },
            data: {
              afternoonAsignee: {
                disconnect: { id },
              },
            },
          });
        case 'evening':
          return await prisma.planningItem.update({
            where: { id: planningItemId },
            data: {
              eveningAsignee: {
                disconnect: { id },
              },
            },
          });
        default:
          throw new TRPCError({
            code: 'PARSE_ERROR',
            message: 'Invalid time of day',
          });
      }
    },
  })
  .mutation('tasks.AssigneeText', {
    input: z.object({
      id: z.string().cuid(),
      text: z.string(),
    }),
    async resolve({ input, ctx }) {
      const { id, text } = input;
      const user = ctx.session?.user;
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to acces this resource',
        });
      }

      const planningItem = await prisma.planningItem.findFirst({
        where: { id },
        select: {
          AssigneeText: true,
        },
      });

      const AssigneeText =
        (planningItem?.AssigneeText as Prisma.JsonObject) ?? {};

      const newAssigneeText = {
        ...AssigneeText,
        [user.id]: text,
      };

      return await prisma.planningItem.update({
        where: { id },
        data: {
          AssigneeText: newAssigneeText,
        },
        select: {
          id: true,
          AssigneeText: true,
        },
      });
    },
  })
  .mutation('tasks.done', {
    input: z.object({
      id: z.string().cuid(),
      done: z.boolean(),
    }),
    async resolve({ input, ctx }) {
      const { id, done } = input;
      const user = ctx.session?.user;
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to acces this resource',
        });
      }

      return await prisma.planningItem.update({
        where: { id },
        data: {
          done,
          doneUserId: done ? user.id : null,
        },
        select: {
          id: true,
          name: true,
          done: true,
        },
      });
    },
  })
  .mutation('tasks.upsert', {
    input: z.object({
      id: z.string().optional(),
      planningId: z.string(),
      name: z.string(),
      ownerId: z.string().nullable().optional(),
      description: z.string(),
      minMorning: z.number().nonnegative(),
      minAfternoon: z.number().nonnegative(),
      minEvening: z.number().nonnegative(),
      maxMorning: z.number().nonnegative(),
      maxAfternoon: z.number().nonnegative(),
      maxEvening: z.number().nonnegative(),
    }),
    async resolve({ input, ctx }) {
      const { id, ...data } = input;
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to acces this resource',
        });
      }

      // FIXME: disallow editing of planning items when a user can't edit the planning
      return await prisma.planningItem.upsert({
        where: {
          id: id || '',
        },
        create: data,
        update: data,
      });
    },
  })
  .mutation('tasks.move', {
    input: z.object({
      id: z.string().cuid(),
      date: z.date(),
    }),
    async resolve({ input, ctx }) {
      const { id, date } = input;
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to acces this resource',
        });
      }

      const item = await prisma.planningItem.delete({
        where: { id },
        include: {
          Planning: {
            select: {
              channelId: true,
            },
          },
        },
      });

      let planning = await prisma.planning.findFirst({
        where: { date, channelId: item.Planning.channelId },
        select: {
          id: true,
        },
      });

      if (!planning) {
        GeneratePlanning(date);
        planning = await prisma.planning.findFirst({
          where: { date, channelId: item.Planning.channelId },
          select: {
            id: true,
          },
        });
      }

      if (!planning?.id) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Could not find planning',
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { Planning, ...itemData } = item;

      return await prisma.planningItem.create({
        data: {
          ...itemData,
          AssigneeText: item.AssigneeText ?? {},
          planningId: planning.id,
        },
      });
    },
  })
  .mutation('rules.upsert', {
    input: z.object({
      id: z.string().optional(),
      name: z.string(),
      description: z.string(),
      rule: z.string(),
      minMorning: z.number().nonnegative(),
      minAfternoon: z.number().nonnegative(),
      minEvening: z.number().nonnegative(),
      maxMorning: z.number().nonnegative(),
      maxAfternoon: z.number().nonnegative(),
      maxEvening: z.number().nonnegative(),
      hasMorning: z.boolean(),
      hasAfternoon: z.boolean(),
      hasEvening: z.boolean(),
      important: z.boolean().optional(),
      channelId: z.string(),
      order: z.number().nonnegative(),
    }),
    async resolve({ input, ctx }) {
      const { id, ...data } = input;
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return await prisma.planningRule.upsert({
        where: {
          id: id || '',
        },
        create: data,
        update: data,
      });
    },
  })
  .mutation('subTasks.finishAll', {
    input: z.object({
      id: z.string().cuid(),
      done: z.boolean(),
    }),
    async resolve({ input, ctx }) {
      const { id, done } = input;
      const user = ctx.session?.user;
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to acces this resource',
        });
      }

      return await prisma.subTask.updateMany({
        where: {
          planningItemId: id,
        },
        data: {
          done,
          doneUserId: done ? user.id : null,
        },
      });
    },
  })
  .mutation('subTask.done', {
    input: z.object({
      id: z.string().cuid(),
      done: z.boolean(),
    }),
    async resolve({ input, ctx }) {
      const { id, done } = input;
      const user = ctx.session?.user;
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to acces this resource',
        });
      }

      return await prisma.subTask.update({
        where: { id },
        data: {
          done,
          doneUserId: done ? user.id : null,
        },
        select: {
          id: true,
          name: true,
          done: true,
        },
      });
    },
  })
  .mutation('rules.addSubTask', {
    input: z.object({
      planningItemId: z.string().cuid().optional(),
      planningRuleId: z.string().cuid().optional(),
      name: z.string(),
    }),
    async resolve({ input, ctx }) {
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return await prisma.subTask.create({
        data: input,
      });
    },
  })
  .mutation('rules.editSubTask', {
    input: z.object({
      id: z.string().cuid(),
      name: z.string(),
    }),
    async resolve({ input, ctx }) {
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return await prisma.subTask.update({
        where: { id: input.id },
        data: input,
      });
    },
  })
  .mutation('rules.removeSubTask', {
    input: z.object({
      id: z.string().cuid(),
    }),
    async resolve({ input, ctx }) {
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return await prisma.subTask.delete({
        where: {
          id: input.id,
        },
      });
    },
  })
  .mutation('rules.delete', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input, ctx }) {
      const { id } = input;
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return await prisma.planningRule.delete({
        where: {
          id,
        },
      });
    },
  })
  .mutation('tasks.delete', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input, ctx }) {
      const { id } = input;
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return await prisma.planningItem.delete({
        where: {
          id,
        },
      });
    },
  })
  .query('rules.all', {
    async resolve({ ctx }) {
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      const planning = await prisma.channel.findMany({
        where: {
          removed: false,
        },
        select: {
          id: true,
          name: true,
          PlanningRule: {
            select: {
              id: true,
              name: true,
              description: true,
              minMorning: true,
              minAfternoon: true,
              minEvening: true,
              maxMorning: true,
              maxAfternoon: true,
              maxEvening: true,
              rule: true,
              channelId: true,
              hasMorning: true,
              hasAfternoon: true,
              hasEvening: true,
              important: true,
              order: true,
              subTask: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          sort: 'asc',
        },
      });

      return planning.map((planningItem) => ({
        ...planningItem,
        PlanningRule: planningItem.PlanningRule.sort(
          (a, b) => a.order - b.order,
        ),
      }));
    },
  })
  .mutation('rules.move', {
    input: z.object({
      id: z.string(),
      sort: z.number(),
    }),
    async resolve({ input, ctx }) {
      const { id, sort } = input;
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return prisma.planningRule.update({
        where: {
          id,
        },
        data: {
          order: sort,
        },
      });
    },
  })
  .query('byDate', {
    input: z.object({
      date: z.date(),
    }),
    async resolve({ input, ctx }) {
      const { date } = input;
      const { session } = ctx;
      if (!session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be authorized',
        });
      }
      let planning = await prisma.planning.findMany({
        where: {
          date: date,
        },
        select: defaultTaskSelect,
      });

      if (planning.length === 0) {
        await GeneratePlanning(date);
        planning = await prisma.planning.findMany({
          where: {
            date: date,
          },
          select: defaultTaskSelect,
        });
      }

      // FIXME: we should be sorting in the prisma query
      return planning
        .sort((a, b) => a.channel.sort - b.channel.sort)
        .map((PlanningItem) => ({
          ...PlanningItem,
          PlanningItem: PlanningItem.PlanningItem.sort((a, b) => {
            if (!a.PlanningRule?.order && !b.PlanningRule?.order) return 0;
            if (!a.PlanningRule?.order) return 1;
            if (!b.PlanningRule?.order) return -1;
            return a.PlanningRule.order - b.PlanningRule.order;
          }),
        }));
    },
  })
  .query('isLocked', {
    input: z.object({
      date: z.date(),
    }),
    async resolve({ input, ctx }) {
      const { date } = input;
      const { session } = ctx;
      if (!session?.user || !session.user.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be authorized',
        });
      }

      const planning = await prisma.planning.findFirst({
        where: {
          date,
        },
        select: {
          locked: true,
        },
      });

      return planning?.locked ? true : false;
    },
  })
  .mutation('lockbyDate', {
    input: z.object({
      date: z.date(),
      locked: z.boolean(),
    }),
    async resolve({ input, ctx }) {
      const { date, locked } = input;
      const { session } = ctx;
      if (!session?.user || !session.user.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be authorized',
        });
      }

      const planning = await prisma.planning.updateMany({
        where: {
          date,
        },
        data: {
          locked,
        },
      });

      return planning;
    },
  })
  .mutation('deleteDay', {
    input: z.object({
      date: z.date(),
    }),
    async resolve({ input, ctx }) {
      const { date } = input;
      const { session } = ctx;
      if (!session?.user || !session.user.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be authorized',
        });
      }

      return await prisma.planning.deleteMany({
        where: {
          date,
        },
      });
    },
  });
