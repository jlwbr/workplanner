import { createRouter } from '~/server/createRouter';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { WebClient } from '@slack/web-api';

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

export const slackRouter = createRouter()
  // update
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
        types: 'public_channel,private_channel',
      });
      if (!channels.ok || !channels.channels)
        return new TRPCError({
          message: 'Could not fetch channels',
          code: 'INTERNAL_SERVER_ERROR',
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
