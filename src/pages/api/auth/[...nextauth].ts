import { Account, PrismaClient } from "@prisma/client";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import SlackProvider from "next-auth/providers/slack";

const prisma = new PrismaClient()

export default NextAuth({
    // Configure one or more authentication providers
    adapter: {
        ...PrismaAdapter(prisma),
        // @ts-ignore slack has extra parameters that typescript does not know about
        linkAccount: ({ ok, state, ...data }: Account) => prisma.account.create({ data })
    },
    providers: [
        SlackProvider({
            clientId: process.env.SLACK_CLIENT_ID!,
            clientSecret: process.env.SLACK_CLIENT_SECRET!
        })
        // ...add more providers here
    ],
})