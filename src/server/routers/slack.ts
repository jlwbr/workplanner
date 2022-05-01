import { createRouter } from '~/server/createRouter';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { WebClient } from '@slack/web-api';

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

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
          name: 'asc',
        },
      });
    },
  })
  .mutation('syncChannels', {
    async resolve() {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          accounts: {
            where: {
              provider: 'slack',
            },
            select: {
              providerAccountId: true,
            },
          },
        },
      });

      const channels = await client.conversations.list({
        types: 'public_channel,private_channel,mpim,im',
        limit: 9999,
      });
      if (!channels.ok || !channels.channels)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be authorized',
        });

      channels.channels.forEach(async ({ id, name }) => {
        if (!id || !name) return;

        const members = await client.conversations.members({ channel: id });
        if (!members.ok || !members.members) return;

        members.members.forEach(async (member) => {
          const user = users.find(({ accounts }) =>
            accounts.find(
              ({ providerAccountId }) => providerAccountId == member,
            ),
          );
          if (!user) return;

          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              channels: {
                connectOrCreate: {
                  where: {
                    id,
                  },
                  create: {
                    id,
                    name,
                  },
                },
              },
            },
          });
        });
      });
    },
  });
