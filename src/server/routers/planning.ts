import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

/**
 * Default selector for Tasks.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const defaultTaskSelect = Prisma.validator<Prisma.PlanningSelect>()({
  id: true,
  date: true,
  channel: {
    select: {
      name: true,
    },
  },
  PlanningItem: {
    select: {
      id: true,
      name: true,
      ownerId: true,
      planningId: true,
      priority: true,
      description: true,
      maxMorning: true,
      maxAfternoon: true,
      maxEvening: true,
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
      timeOfDay: z.enum(['morning', 'afternoon', 'evening']),
    }),
    async resolve({ input, ctx }) {
      const { planningItemId, timeOfDay } = input;
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      switch (timeOfDay) {
        case 'morning':
          return await prisma.planningItem.update({
            where: { id: planningItemId },
            data: {
              morningAsignee: {
                connect: { id: ctx.session?.user?.id },
              },
            },
          });
        case 'afternoon':
          return await prisma.planningItem.update({
            where: { id: planningItemId },
            data: {
              afternoonAsignee: {
                connect: { id: ctx.session?.user?.id },
              },
            },
          });
        case 'evening':
          return await prisma.planningItem.update({
            where: { id: planningItemId },
            data: {
              eveningAsignee: {
                connect: { id: ctx.session?.user?.id },
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
  .mutation('tasks.upsert', {
    input: z.object({
      id: z.string().optional(),
      planningId: z.string(),
      name: z.string(),
      ownerId: z.string().nullable().optional(),
      description: z.string(),
      priority: z.number(),
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

      return await prisma.planningItem.upsert({
        where: {
          id: id || '',
        },
        create: data,
        update: data,
      });
    },
  })
  .mutation('rules.upsert', {
    input: z.object({
      id: z.string().optional(),
      name: z.string(),
      description: z.string(),
      priority: z.number(),
      rule: z.string(),
      maxMorning: z.number().nonnegative(),
      maxAfternoon: z.number().nonnegative(),
      maxEvening: z.number().nonnegative(),
      channelId: z.string(),
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

      return await prisma.channel.findMany({
        where: {
          members: {
            some: {
              id: ctx.session.user.id,
            },
          },
        },
        select: {
          id: true,
          name: true,
          PlanningRule: {
            select: {
              id: true,
              name: true,
              priority: true,
              description: true,
              maxMorning: true,
              maxAfternoon: true,
              maxEvening: true,
              rule: true,
              channelId: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
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
      const planning = await prisma.planning.findMany({
        where: {
          date: date,
          channel: {
            is: {
              members: {
                some: {
                  id: session.user.id,
                },
              },
            },
          },
        },
        select: defaultTaskSelect,
      });

      if (planning.length === 0) {
        const hasPlanning = await prisma.planning.findMany({
          where: {
            date: date,
          },
        });

        if (hasPlanning.length === 0) {
          return false;
        }
      }
      return planning;
    },
  });
