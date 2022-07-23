import { Account, PrismaClient } from '@prisma/client';
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import SlackProvider from 'next-auth/providers/slack';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
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
    jwt: async ({ token, user }) => {
      if (user?.id) token.id = user.id;
      if (user?.roles) token.roles = user.roles;

      return token;
    },

    session: async ({ session, token }) => {
      if (session?.user) {
        if (token?.id && typeof token.id === 'string')
          session.user.id = token.id;
        if (token?.roles && Array.isArray(token.roles))
          session.user.roles = token.roles;
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
};

export default NextAuth(authOptions);
