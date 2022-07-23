import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { prisma } from '../prisma';

// TODO: This whole file is a mess. It should be refactored.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pl from 'tau-prolog';
import { PlanningRule, PrismaPromise } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('tau-prolog/modules/promises.js')(pl);

const generateProgram = (date: Date, rule: string) => `
timestamp(today, ${date.valueOf()}).

today(X) :- weekday(X, today).
today(weekend) :- weekend(today).

weekday(monday, 1).
weekday(tuesday, 2).
weekday(wednesday, 3).
weekday(thursday, 4).
weekday(friday, 5).
weekday(saturday, 6).
weekday(sunday, 7).

weekday(X, Date) :-
  timestamp(Date, D),
  time_property(D, weekday(Num)),
  weekday(X, Num).

weekend(saturday).
weekend(sunday).

weekend(X) :-
  weekday(Day, X),
    weekend(Day).

    test_all(X) :-
  findall(Y, task(Y), X).

${rule}
`;

function fromList<T>(xs: any) {
  const arr = [];
  while (pl.type.is_term(xs) && xs.indicator === './2') {
    arr.push(xs.args[0].id);
    xs = xs.args[1];
  }
  if (pl.type.is_term(xs) && xs.indicator === '[]/0')
    return arr as unknown as T[];
  return null;
}

export const prologRouter = createRouter().mutation('Check', {
  input: z.string(),
  async resolve({ input }) {
    const session = pl.create();

    const program = generateProgram(new Date(), `test :- ${input}`);

    try {
      await session.promiseQuery('test.');
      await session.promiseConsult(program);

      for await (const answer of session.promiseAnswers()) {
        const formatted = session.format_answer(answer);
        if (!formatted.includes('true') && !formatted.includes('false'))
          return { success: false };
      }
      return {
        success: true,
      };
    } catch (e) {
      console.log(e);
      return {
        success: false,
      };
    }
  },
});

export const GeneratePlanning = async (date: Date) => {
  const session = pl.create();

  const channels = await prisma.channel.findMany({
    where: {
      removed: false,
    },
    include: {
      PlanningRule: {
        include: {
          subTask: true,
        },
      },
    },
  });

  const PlanningRules = channels.reduce((acc: PlanningRule[], channel) => {
    return acc.concat(channel.PlanningRule);
  }, []);

  if (PlanningRules.length == 0) return;

  const program = generateProgram(
    date,
    PlanningRules.map((rule) => `task(${rule.id}) :- ${rule.rule}`).join('\n'),
  );

  await session.promiseConsult(program);
  await session.promiseQuery('test_all(X).');

  for await (const answer of session.promiseAnswers()) {
    const ids = fromList<string>(answer.lookup('X'));

    for (const channel of channels) {
      const filteredRules = channel.PlanningRule.filter((rule) =>
        ids?.includes(rule.id),
      );

      const planning = await prisma.planning.create({
        data: {
          channelId: channel.id,
          date,
          PlanningItem: {
            createMany: {
              data: filteredRules.map((item) => ({
                name: item.name,
                planningRuleId: item.id,
                hasMorning: item.hasMorning,
                hasAfternoon: item.hasAfternoon,
                hasEvening: item.hasEvening,
                maxMorning: item.maxMorning,
                maxAfternoon: item.maxAfternoon,
                maxEvening: item.maxEvening,
                description: item.description,
                important: item.important,
              })),
            },
          },
        },
        select: {
          PlanningItem: {
            select: {
              id: true,
              planningRuleId: true,
            },
          },
        },
      });

      const transaction: PrismaPromise<any>[] = [];
      planning.PlanningItem.forEach((item) => {
        const subTasks =
          filteredRules.find((rule) => rule.id === item.planningRuleId)
            ?.subTask || [];

        if (subTasks.length <= 0) return;

        transaction.push(
          prisma.planningItem.update({
            where: {
              id: item.id,
            },
            data: {
              subTask: {
                createMany: {
                  data: subTasks.map((subTask) => ({
                    name: subTask.name,
                  })),
                },
              },
            },
          }),
        );
      });

      await prisma.$transaction(transaction);
    }
  }
};
