import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createRouter } from '~/server/createRouter';

export const planningRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    const { gate } = ctx;
    if (gate && !gate.allows('planning.read')) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have permission for this action',
      });
    }

    return next();
  })
  .query('rows', {
    input: z.object({
      date: z.date(),
    }),
    async resolve({ input, ctx }) {
      const { date } = input;
      return await ctx.prisma.planning.findMany({
        where: {
          date,
        },
        select: {
          id: true,
          channel: {
            select: {
              id: true,
              name: true,
              canAdd: true,
            },
          },
          locked: true,
        },
      });
    },
  })
  .query('rules', {
    input: z.object({
      planning: z.string().cuid(),
    }),
    async resolve({ input, ctx }) {
      const { planning } = input;
      return await ctx.prisma.planningItem.findMany({
        where: {
          planningId: planning,
        },
        select: {
          id: true,
        },
      });
    },
  });
