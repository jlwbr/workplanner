import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { Prisma, PrismaPromise } from '@prisma/client';

/**
 * Default selector for Tasks.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const defaultScheduleSelect = Prisma.validator<Prisma.ScheduleSelect>()({
  id: true,
  userId: true,
  user: {
    select: {
      id: true,
      name: true,
    },
  },
  date: true,
  schedule: true,
});

function getISOWeek(w: number, y: number) {
  const simple = new Date(y, 0, 1 + (w - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  const temp = {
    d: ISOweekStart.getDate(),
    m: ISOweekStart.getMonth(),
    y: ISOweekStart.getFullYear(),
  };
  const numDaysInMonth = new Date(temp.y, temp.m + 1, 0).getDate();

  return Array.from({ length: 7 }, () => {
    if (temp.d > numDaysInMonth) {
      temp.m += 1;
      temp.d = 1;
    }
    return new Date(new Date(temp.y, temp.m, temp.d++).setUTCHours(0, 0, 0, 0));
  });
}

export const scheduleRouter = createRouter()
  .query('getAll', {
    input: z.object({
      date: z.date(),
    }),
    async resolve({ input, ctx }) {
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return prisma.schedule.findMany({
        where: input,
        select: defaultScheduleSelect,
        orderBy: {
          schedule: 'asc',
        },
      });
    },
  })
  .mutation('import', {
    input: z.object({
      data: z.array(
        z.object({
          id: z.string().or(z.boolean()),
          name: z.string(),
          data: z.array(z.string().or(z.undefined())),
        }),
      ),
      week: z.string(),
    }),
    async resolve({ input, ctx }) {
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      const { data, week } = input;

      const isoWeek = getISOWeek(
        parseInt(week.slice(6), 10),
        parseInt(week.slice(0, 4), 10),
      );

      await prisma.schedule.deleteMany({
        where: {
          date: { in: isoWeek },
        },
      });

      const schedules: PrismaPromise<any>[] = [];
      isoWeek.forEach(async (day, index) => {
        data.forEach(async ({ id, data }) => {
          const schedule = data[index];
          if (!schedule || typeof id == 'boolean') return;

          schedules.push(
            prisma.schedule.upsert({
              where: {
                userId_date: {
                  userId: id,
                  date: day,
                },
              },
              update: {
                schedule: schedule,
              },
              create: {
                userId: id,
                date: day,
                schedule: schedule,
              },
            }),
          );
        });
      });

      await prisma.$transaction(schedules);
    },
  });
