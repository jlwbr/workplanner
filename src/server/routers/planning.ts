import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

/**
 * Default selector for Post.
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
  // create
  .query('byDate', {
    input: z.object({
      date: z.date(),
    }),
    async resolve({ input }) {
      const { date } = input;
      const planning = prisma.planning.findMany({
        where: {
          date: date,
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
