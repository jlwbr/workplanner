import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { create } from 'domain';

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
      PlanningRule: {
        select: {
          name: true,
        },
      },
    },
  },
});

export const planningRouter = createRouter()
  .mutation('rules.upsert', {
    input: z.object({
      id: z.string().optional(),
      name: z.string(),
      rule: z.string(),
      channelId: z.string(),
    }),
    async resolve({ input, ctx }) {
      const { id, ...data } = input;
      if (!ctx.session?.user?.isAdmin && !ctx.session?.user?.isEditor) {
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
  .query('rules.all', {
    async resolve({ ctx }) {
      if (!ctx.session?.user?.isAdmin && !ctx.session?.user?.isEditor) {
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
      const planning = prisma.planning.findMany({
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
      if (!planning) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No planning with date '${date}'`,
        });
      }
      return planning;
    },
  });
