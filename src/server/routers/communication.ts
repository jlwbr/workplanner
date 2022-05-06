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
const defaultCommunicationSelect =
  Prisma.validator<Prisma.CommunicationSelect>()({
    id: true,
    userId: true,
    date: true,
    phoneNumber: true,
    HT: true,
  });

export const communicationRouter = createRouter()
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

      return prisma.communication.findMany({
        where: input,
        select: defaultCommunicationSelect,
      });
    },
  })
  .mutation('upsert', {
    input: z.object({
      date: z.date(),
      userId: z.string(),
      TimeOffDay: z.nativeEnum(TimeOffDay),
      phoneNumber: z.string(),
      HT: z.boolean(),
    }),
    async resolve({ input, ctx }) {
      const { date, userId, TimeOffDay, phoneNumber, HT } = input;
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return prisma.communication.upsert({
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
          phoneNumber,
          HT,
        },
        update: {
          phoneNumber,
          HT,
        },
        select: defaultCommunicationSelect,
      });
    },
  });
