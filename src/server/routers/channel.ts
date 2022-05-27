import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';

export const ChannelRouter = createRouter()
  // update
  .query('all', {
    async resolve({ ctx }) {
      if (!ctx.session?.user?.isAdmin && !ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return await prisma.channel.findMany({
        where: {
          removed: false,
        },
        select: {
          id: true,
          name: true,
          sort: true,
        },
        orderBy: {
          sort: 'asc',
        },
      });
    },
  })
  .mutation('add', {
    input: z.object({
      name: z.string(),
      sort: z.number(),
    }),
    async resolve({ input, ctx }) {
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return prisma.channel.create({
        data: input,
      });
    },
  })
  .mutation('edit', {
    input: z.object({
      id: z.string(),
      name: z.string(),
    }),
    async resolve({ input, ctx }) {
      const { id, name } = input;
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return prisma.channel.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });
    },
  })
  .mutation('remove', {
    input: z.object({
      id: z.string().cuid(),
    }),
    async resolve({ input, ctx }) {
      const { id } = input;
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return prisma.channel.update({
        where: {
          id,
        },
        data: {
          removed: true,
        },
      });
    },
  })
  .mutation('move', {
    input: z.object({
      id: z.string(),
      sort: z.number(),
    }),
    async resolve({ input, ctx }) {
      const { id, sort } = input;
      if (!ctx.session?.user?.isEditor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be an admin or editor to acces this resource',
        });
      }

      return prisma.channel.update({
        where: {
          id,
        },
        data: {
          sort,
        },
      });
    },
  });
