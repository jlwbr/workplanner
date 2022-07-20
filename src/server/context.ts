/* eslint-disable @typescript-eslint/no-unused-vars */
import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { Session } from 'next-auth';
import Gate from '~/utils/gate';
import { default as getServerSession } from 'next-auth/next';
import { prisma } from './prisma';
import { authOptions } from '~/pages/api/auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CreateContextOptions {
  session: Session | null;
  gate: Awaited<ReturnType<typeof Gate>> | null;
  prisma: PrismaClient;
}

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export async function createContextInner(_opts: CreateContextOptions) {
  return _opts;
}

export type Context = trpc.inferAsyncReturnType<typeof createContextInner>;

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(
  opts: trpcNext.CreateNextContextOptions,
): Promise<Context> {
  // for API-response caching see https://trpc.io/docs/caching

  const session = await getServerSession(opts.req, opts.res, authOptions);
  const gate = session?.user?.id ? await Gate(session.user.id, prisma) : null;

  const ctx = await createContextInner({
    session,
    gate,
    prisma,
  });
  return ctx;
}
