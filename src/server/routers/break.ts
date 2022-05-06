import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { Prisma, TimeOffDay } from '@prisma/client';

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
      TimeOffDay: z.nativeEnum(TimeOffDay),
    }),
    async resolve({ input, ctx }) {
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return prisma.break.findMany({
        where: input,
        select: defaultBreakSelect,
      });
    },
  })
  .mutation('upsert', {
    input: z.object({
      date: z.date(),
      userId: z.string(),
      TimeOffDay: z.nativeEnum(TimeOffDay),
      number: z.number(),
    }),
    async resolve({ input, ctx }) {
      const { date, userId, TimeOffDay, number } = input;
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return prisma.break.upsert({
        where: {
          userId_date_TimeOffDay: {
            userId,
            date,
            TimeOffDay,
          },
        },
        create: {
          userId,
          date,
          TimeOffDay,
          number,
        },
        update: {
          number,
        },
        select: defaultBreakSelect,
      });
    },
  });
