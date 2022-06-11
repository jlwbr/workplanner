import { createRouter } from '~/server/createRouter';
import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { WebClient } from '@slack/web-api';

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

export const slackRouter = createRouter()
  .query('update', {
    async resolve() {
        const prismaUsers = await prisma.user.findMany({
            select: {
              id: true,
              name: true,
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

        const result = await client.users.list();
        if (!result.ok || !result.members)
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'You must be authorized',
            });
        
        result.members.forEach(async member => {
            const user = prismaUsers.find(u => u.accounts.some(a => a.providerAccountId === member.id));

            if(user?.name === member.profile?.real_name) return;
            if (!user) return;

            await prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    name: member.profile?.real_name,
                },
            });
        });
    },
  });