import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import groupBy from '~/utils/groupBy';

/**
 * Default selector for Tasks.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const defaultBreakSelect = Prisma.validator<Prisma.BreakSelect>()({
  id: true,
  userId: true,
  date: true,
  number: true,
});

export const breakRouter = createRouter()
  .query('getAll', {
    input: z.object({
      date: z.date(),
    }),
    async resolve({ input }) {
      const users = await prisma.user.findMany({
        select: { id: true, defaultBreak: true },
      });
      const customBreak = await prisma.break.findMany({
        where: input,
        select: defaultBreakSelect,
      });

      const breaks = groupBy(customBreak, ({ userId }) => userId);

      return users.map((user) => {
        if (breaks[user.id]) return breaks[user.id][0];

        return {
          id: 'default',
          userId: user.id,
          date: input.date,
          number: user.defaultBreak,
        };
      });
    },
  })
  .mutation('upsert', {
    input: z.object({
      date: z.date(),
      userId: z.string(),
      number: z.number(),
    }),
    async resolve({ input, ctx }) {
      const { date, userId, number } = input;
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return prisma.break.upsert({
        where: {
          userId_date: {
            userId,
            date,
          },
        },
        create: {
          userId,
          date,
          number,
        },
        update: {
          number,
        },
        select: defaultBreakSelect,
      });
    },
  });
