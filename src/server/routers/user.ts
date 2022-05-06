import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

/**
 * Default selector for Tasks.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const defaultUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
});

export const userRouter = createRouter().query('all', {
  async resolve({ ctx }) {
    if (!ctx.session?.user?.isEditor) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be an admin or editor to acces this resource',
      });
    }

    return prisma.user.findMany({
      select: defaultUserSelect,
    });
  },
});
