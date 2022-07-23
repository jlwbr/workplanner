/* Heavily based on https://github.com/nextauthjs/next-auth/discussions/805#discussioncomment-576007 */

import { PrismaClient } from '@prisma/client';

/**
 * Gate - returns a promised object containing methods to determine
 * if a given user is authorised against a give permisson(s)
 *
 * The gate fetches a copy of the user from a server-side store, rather than
 * relying on a session object directly. Since it is not easy to invalidate JWTs,
 * the local session's associated permissons could become stale. Checking with the
 * server-side store every time, whilst introducing a read operations,
 * more robustly enforces permissions as it relies a single source of truth.
 *
 * @param {string} userId - the ID of the user to gate against.
 * @param {object} faunaClient - an instance of a Fauna DB client.
 * @returns {Promise}
 */
const Gate = async (userId: string, prismaClient: PrismaClient) => {
  /**
   * Retrieve the user and their given roles from the server-side store.
   */
  const user = await prismaClient.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      roles: {
        select: {
          permissions: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user?.roles)
    return Promise.reject(new Error('gate_error_fetching_user'));

  const userPermissions = user.roles.flatMap(({ permissions }) =>
    permissions.map(({ name }) => name),
  );

  /**
   * Determines if a user is assigned a given permisson.
   * @param {string} permisson - the permissons to check against.
   * @returns {boolean}
   */
  const allows = (permisson: string) => userPermissions.includes(permisson);

  /**
   * Determines if a user is assigned all given permissons.
   * @param {[string]} permissons - the permissons to check against.
   * @returns {boolean}
   */
  const all = (permissons: string[]) =>
    permissons
      .map((permisson) => userPermissions.includes(permisson))
      .reduce(
        (allIncludes, includes) => (includes ? allIncludes : false),
        true,
      );

  /**
   * Determines if a user is assigned at least one of the given permissons.
   * @param {[string]} permissons - the permissons to check against.
   * @returns {boolean}
   */
  const any = (permissons: string[]) =>
    permissons
      .map((permisson) => userPermissions.includes(permisson))
      .reduce(
        (allIncludes, includes) => (includes ? true : allIncludes),
        false,
      );

  /**
   * Determines which given permissons are missing from the user's permissons.
   * @param {[string]} permissons - the permissons to check against.
   * @returns {[string]} the missing permissions
   */
  const missing = (permissons: string[]) =>
    permissons.filter((permisson) => !userPermissions.includes(permisson));

  return { allows, all, any, missing };
};

export default Gate;
