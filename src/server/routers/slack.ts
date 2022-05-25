import { createRouter } from '~/server/createRouter';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';

export const slackRouter = createRouter()
  // update
  .query('channels.all', {
    async resolve({ ctx }) {
      if (!ctx.session?.user?.isAdmin && !ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return await prisma.channel.findMany({
        where: {
          members: {
            some: {
              id: ctx.session.user.id,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          sort: 'asc',
        },
      });
    },
  });
