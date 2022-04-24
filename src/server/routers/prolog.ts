import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { prisma } from '../prisma';

// TODO: This whole file is a mess. It should be refactored.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pl from 'tau-prolog';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('tau-prolog/modules/promises.js')(pl);

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

const groupByKey = (list: any[], key: string) =>
  list.reduce(
    (hash, obj) => ({
      ...hash,
      [obj[key]]: (hash[obj[key]] || []).concat(obj),
    }),
    {},
  );

export const prologRouter = createRouter()
  // update
  .mutation('FilterDay', {
    input: z.object({
      date: z.date(),
    }),
    async resolve({ input }) {
      const { date } = input;
      const session = pl.create();

      const PlanningRules = await prisma.planningRule.findMany();

      const program = `
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

        ${PlanningRules.map((rule) => `task(${rule.id}) :- ${rule.rule}`).join(
          '\n',
        )}
      `;

      type PlanningRulesByChannelId = {
        [key: string]: {
          id: string;
          name: string;
          description: string;
          maxMorning: number;
          maxAfternoon: number;
          maxEvening: number;
          priority: number;
          channelId: string;
        }[];
      };

      const channels: PlanningRulesByChannelId = groupByKey(
        PlanningRules,
        'channelId',
      );

      await session.promiseConsult(program);
      await session.promiseQuery('test_all(X).');

      for await (const answer of session.promiseAnswers()) {
        const ids = fromList<string>(answer.lookup('X'));

        if (ids && ids?.length > 0) {
          for (const channel in channels) {
            const rules = channels[channel] || [];
            const filteredRules = rules.filter((rule) => ids.includes(rule.id));

            if (filteredRules.length > 0) {
              await prisma.planning.create({
                data: {
                  channelId: channel,
                  date,
                  PlanningItem: {
                    createMany: {
                      data: filteredRules.map((item) => ({
                        name: item.name,
                        planningRuleId: item.id,
                        priority: item.priority,
                        maxMorning: item.maxMorning,
                        maxAfternoon: item.maxAfternoon,
                        maxEvening: item.maxEvening,
                        description: item.description,
                      })),
                    },
                  },
                },
              });
            }
          }

          return true;
        }
      }
    },
  });
