import { Account, PrismaClient } from '@prisma/client';
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import SlackProvider from 'next-auth/providers/slack';

const prisma = new PrismaClient();

export default NextAuth({
  // Configure one or more authentication providers
  adapter: {
    ...PrismaAdapter(prisma),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore slack has extra parameters that typescript does not know about
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    linkAccount: ({ ok, state, ...data }: Account) =>
      prisma.account.create({ data }),
  },
  /* eslint-enable */
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
        const prismaUser = await prisma.user.findUnique({
          where: {
            id: token.sub,
          },
        });

        if (prismaUser) {
          session.user.isAdmin = prismaUser.admin;
          session.user.isEditor = prismaUser.editor || prismaUser.admin;
          session.user.isShared = prismaUser.shared;
        }
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    SlackProvider({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      clientId: process.env.SLACK_CLIENT_ID!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
    }),
    // ...add more providers here
  ],
});
