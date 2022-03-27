/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */

import { createRouter } from '~/server/createRouter';
import { boolean, z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

/**
 * Default selector for Post.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const defaultTaskSelect = Prisma.validator<Prisma.TodoItemSelect>()({
  id: true,
  name: true,
  categoryId: true,
  rules: true,
  done: true,
});

export const todoRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      id: z.string().cuid().optional(),
      name: z.string().min(1).max(32),
      categoryId: z.string().min(1),
      rules: z.array(z.boolean()).min(5).max(7),
      done: z.array(z.boolean()),
    }),
    async resolve({ input }) {
      const post = await prisma.todoItem.create({
        data: input,
        select: defaultTaskSelect,
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

      return prisma.todoItem.findMany({
        select: defaultTaskSelect,
      });
    },
  })
  .query('byCategory', {
    input: z.object({
      categoryId: z.string().cuid(),
    }),
    async resolve({ input }) {
      const { categoryId } = input;
      const post = await prisma.todoItem.findMany({
        where: { categoryId },
        select: defaultTaskSelect,
      });
      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No todo with categoryId '${categoryId}'`,
        });
      }
      return post;
    },
  })
  .query('byId', {
    input: z.object({
      id: z.string().cuid(),
    }),
    async resolve({ input }) {
      const { id } = input;
      const post = await prisma.todoItem.findUnique({
        where: { id },
        select: defaultTaskSelect,
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
      id: z.string().cuid(),
      data: z.object({
        name: z.string().min(1).max(32).optional(),
        categoryId: z.string().min(1).optional(),
        rules: z.array(z.boolean()).min(5).max(7).optional(),
        done: z.array(z.boolean()).optional(),
      }),
    }),
    async resolve({ input }) {
      const { id, data } = input;
      const post = await prisma.todoItem.update({
        where: { id },
        data,
        select: defaultTaskSelect,
      });
      return post;
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      id: z.string().cuid(),
    }),
    async resolve({ input }) {
      const { id } = input;
      await prisma.todoItem.delete({ where: { id } });
      return {
        id,
      };
    },
  });
