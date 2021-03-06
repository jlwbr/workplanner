/**
 * This file contains the root router of your tRPC-backend
 */
import superjson from 'superjson';
import { createRouter } from '../createRouter';
import { planningRouter } from './planning';
import { prologRouter } from './prolog';
import { communicationRouter } from './communication';
import { breakRouter } from './break';
import { userRouter } from './user';
import { scheduleRouter } from './schedule';
import { ChannelRouter } from './channel';
import { slackRouter } from './slack';
/**
 * Create your application's root router
 * If you want to use SSG, you need export this
 * @link https://trpc.io/docs/ssg
 * @link https://trpc.io/docs/router
 */
export const appRouter = createRouter()
  /**
   * Add data transformers
   * @link https://trpc.io/docs/data-transformers
   */
  .transformer(superjson)
  /**
   * Optionally do custom error (type safe!) formatting
   * @link https://trpc.io/docs/error-formatting
   */
  // .formatError(({ shape, error }) => { })
  /**
   * Add a health check endpoint to be called with `/api/trpc/healthz`
   */
  .query('healthz', {
    async resolve() {
      return 'yay!';
    },
  })
  .merge('planning.', planningRouter)
  .merge('communication.', communicationRouter)
  .merge('break.', breakRouter)
  .merge('user.', userRouter)
  .merge('prolog.', prologRouter)
  .merge('schedule.', scheduleRouter)
  .merge('channel.', ChannelRouter)
  .merge('slack.', slackRouter);

export type AppRouter = typeof appRouter;
