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
const defaultTodoCategorySelect = Prisma.validator<Prisma.TodoCategorySelect>()(
  {
    id: true,
    name: true,
    TodoItems: true,
  },
);

export const todoCategoryRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(32),
    }),
    async resolve({ input }) {
      const post = await prisma.todoCategory.create({
        data: input,
        select: defaultTodoCategorySelect,
      });
      return post;
    },
  })
  // read
  .query('all', {
    async resolve() {
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      return prisma.todoCategory.findMany({
        select: defaultTodoCategorySelect,
      });
    },
  })
  .query('byId', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input }) {
      const { id } = input;
      const post = await prisma.todoCategory.findUnique({
        where: { id },
        select: defaultTodoCategorySelect,
      });
      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No todo with id '${id}'`,
        });
      }
      return post;
    },
  })
  // update
  .mutation('edit', {
    input: z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().min(1).max(32),
      }),
    }),
    async resolve({ input }) {
      const { id, data } = input;
      const post = await prisma.todoCategory.update({
        where: { id },
        data,
        select: defaultTodoCategorySelect,
      });
      return post;
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input }) {
      const { id } = input;
      await prisma.todoCategory.delete({ where: { id } });
      return {
        id,
      };
    },
  });
