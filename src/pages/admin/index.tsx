import { ReactElement } from 'react';
import { AdminLayout } from '~/components/AdminLayout';
import { NextPageWithLayout } from '~/pages/_app';

const IndexPage: NextPageWithLayout = () => {
  return <p>Hallo</p>;
};

IndexPage.getLayout = (page: ReactElement) => <AdminLayout>{page}</AdminLayout>;

export default IndexPage;
