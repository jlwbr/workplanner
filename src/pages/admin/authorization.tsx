import { useSession } from 'next-auth/react';
import { FC, ReactElement, useState } from 'react';
import { AdminLayout } from '~/components/AdminLayout';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const Input: FC<{
  user: any;
}> = ({ user }) => {
  const context = trpc.useContext();
  const upsertMutation = trpc.useMutation(['user.update'], {
    onSuccess: () => {
      context.invalidateQueries(['user.all']);
    },
  });
  const [admin, setAdmin] = useState(user.admin);
  const [editor, setEditor] = useState(user.editor);
  const [shared, setShared] = useState(user.shared);

  return (
    <tr key={user.id}>
      <td className="border-b border-slate-100 p-4 pl-8 w-full text-slate-700">
        {user.name}
      </td>
      <td className="border-b border-slate-100 p-4 pr-8 text-center text-slate-700">
        <input
          checked={shared}
          onChange={() => {
            upsertMutation.mutateAsync({
              id: user.id,
              shared: !shared,
            });
            setShared(!shared);
          }}
          type="checkbox"
          className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
        />
      </td>
      <td className="border-b border-slate-100 p-4 pr-8 text-center text-slate-700">
        <input
          checked={editor}
          onChange={() => {
            upsertMutation.mutateAsync({
              id: user.id,
              editor: !editor,
            });
            setEditor(!editor);
          }}
          type="checkbox"
          className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
        />
      </td>
      <td className="border-b border-slate-100 p-4 pr-8 text-center text-slate-700">
        <input
          checked={admin}
          onChange={() => {
            upsertMutation.mutateAsync({
              id: user.id,
              admin: !admin,
            });
            setAdmin(!admin);
          }}
          type="checkbox"
          className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
        />
      </td>
    </tr>
  );
};

const Table: FC<{
  currentUserId?: string;
}> = ({ currentUserId }) => {
  const query = trpc.useQuery(['user.all']);

  if (!query.isSuccess) return null;

  return (
    <div className="not-prose relative bg-slate-50 rounded-xl overflow-hidden">
      <div
        style={{ backgroundPosition: '10px 10px' }}
        className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))]"
      ></div>
      <div className="relative rounded-xl overflow-auto">
        <div className="shadow-sm overflow-hidden my-8">
          <table className="border-collapse table-auto w-full text-sm">
            <thead>
              <tr>
                <th className="border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-600 text-left">
                  Naam
                </th>
                <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                  Gedeeld
                </th>
                <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                  Editor
                </th>
                <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                  Admin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {query.data
                .filter(({ id }) => id !== currentUserId)
                .map((user) => (
                  <Input key={user.id} user={user} />
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none border border-black/5 rounded-xl"></div>
    </div>
  );
};

const AuthorizationPage: NextPageWithLayout = () => {
  const { data } = useSession();

  if (data && data.user && !data.user.isAdmin) {
    return <p>UNAUTHORIZED</p>;
  }

  return (
    <div>
      <h1 className="text-xl text-center p-4">Authorisaties</h1>
      <Table currentUserId={data?.user?.id} />
    </div>
  );
};
AuthorizationPage.getLayout = (page: ReactElement) => (
  <AdminLayout>{page}</AdminLayout>
);
AuthorizationPage.requireAuth = true;

export default AuthorizationPage;
