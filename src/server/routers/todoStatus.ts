import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

/**
 * Default selector for Post.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const defaultTodoStatusSelect = Prisma.validator<Prisma.TodoStatusSelect>()({
  id: true,
  date: true,
  status: true,
});

export const todoStatusRouter = createRouter()
  // create
  .mutation('upsert', {
    input: z.object({
      id: z.string().cuid().optional(),
      date: z.date(),
      status: z.boolean(),
      userId: z.string().cuid(),
      todoItemId: z.string().cuid(),
    }),
    async resolve({ input }) {
      const post = await prisma.todoStatus.upsert({
        create: input,
        update: {
          status: input.status,
        },
        where: {
          id: input.id,
          key: {
            todoItemId: input.todoItemId,
            date: input.date,
          },
        },
        select: defaultTodoStatusSelect,
      });
      return post;
    },
  })
  // read
  .query('unique', {
    input: z.object({
      todoItemId: z.string().cuid(),
      date: z.date(),
    }),
    async resolve({ input }) {
      const todoStatus = await prisma.todoStatus.findUnique({
        where: {
          key: input,
        },
        select: defaultTodoStatusSelect,
      });
      if (!todoStatus) {
        return {
          id: 'mock-id',
          date: input.date,
          status: false,
        };
      }
      return todoStatus;
    },
  });
