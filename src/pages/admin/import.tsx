import { ReactElement, useState } from 'react';
import { AdminLayout } from '~/components/AdminLayout';
import { NextPageWithLayout } from '~/pages/_app';
import { FileUploader } from 'react-drag-drop-files';
import * as XLSX from 'xlsx';
import { trpc } from '~/utils/trpc';
import Select from 'react-select';
import toast from 'react-hot-toast';

const fileTypes = ['CSV', 'XLS', 'TSV', 'XLSX', 'ODS'];

type day = {
  id: string | boolean;
  name: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
};

const ImportPage: NextPageWithLayout = () => {
  const users = trpc.useQuery(['user.all']);
  const [data, setData] = useState<day[] | null>();
  const [week, setWeek] = useState('');
  const scheduleMutation = trpc.useMutation(['schedule.import']);
  const handleChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target) return;

      const data = e.target.result;
      const workbook = XLSX.read(data);

      parse_workbook(workbook, 'tiel');
    };
    reader.readAsArrayBuffer(file);
  };

  const parse_workbook = (workbook: XLSX.WorkBook, layout: string) => {
    if (!workbook || !users.data) return;
    let data: day[] = [];
    switch (layout) {
      case 'tiel':
        const json = XLSX.utils.sheet_to_json(workbook.Sheets['Import']);
        data = json
          .map((row: any) => {
            if (!row['Naam']) return;
            const user = users.data.find(
              (u) => u.name?.toLowerCase() === row['Naam']?.toLowerCase(),
            );
            return {
              id: user ? user.id : false,
              name: row['Naam'],
              monday:
                typeof row['Maandag'] == 'string' && row['Maandag']
                  ? row['Maandag']
                  : '',
              tuesday:
                typeof row['Dinsdag'] == 'string' && row['Dinsdag']
                  ? row['Dinsdag']
                  : '',
              wednesday:
                typeof row['Woensdag'] == 'string' && row['Woensdag']
                  ? row['Woensdag']
                  : '',
              thursday:
                typeof row['Donderdag'] == 'string' && row['Donderdag']
                  ? row['Donderdag']
                  : '',
              friday:
                typeof row['Vrijdag'] == 'string' && row['Vrijdag']
                  ? row['Vrijdag']
                  : '',
              saturday:
                typeof row['Zaterdag'] == 'string' && row['Zaterdag']
                  ? row['Zaterdag']
                  : '',
              sunday:
                typeof row['Zondag'] == 'string' && row['Zondag']
                  ? row['Zondag']
                  : '',
            };
          })
          .filter(
            (row): row is day =>
              row !== undefined &&
              (!!row.monday ||
                !!row.tuesday ||
                !!row.wednesday ||
                !!row.thursday ||
                !!row.friday ||
                !!row.saturday ||
                !!row.sunday),
          );
      default:
        break;
    }

    setData(data);
  };

  if (users.isLoading || !users.data) return null;

  const options = users.data.map((user) => ({
    value: user.id,
    label: user.name || `Anoniem (${user.id.slice(0, 4)})`,
  }));

  return (
    <>
      <h1 className="text-2xl text-center  p-8 ">Importeer rooster</h1>
      <div className="flex justify-center gap-2 pb-8">
        <FileUploader
          handleChange={handleChange}
          name="file"
          types={fileTypes}
          label="Upload bestand"
        />
        <input
          className="border-2 rounded-lg p-2 mx-2"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          type="week"
          name="Week"
          required
        ></input>
        <button
          className="btn-primary transition duration-300 ease-in-out focus:outline-none focus:shadow-outline bg-blue-700 hover:bg-blue-900 text-white font-normal py-2 px-4 mr-1 rounded"
          onClick={() =>
            toast.promise(
              scheduleMutation.mutateAsync({
                week,
                data:
                  data?.map((row) => ({
                    id: row.id,
                    name: row.name,
                    data: [
                      row.monday,
                      row.tuesday,
                      row.wednesday,
                      row.thursday,
                      row.friday,
                      row.saturday,
                      row.sunday,
                    ],
                  })) || [],
              }),
              {
                loading: 'Laden...',
                success: 'Rooster succesvol geimporteerd!',
                error: 'Er is iets fout gegaan!',
              },
            )
          }
        >
          Importeer
        </button>
      </div>
      {data ? (
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
                      Maandag
                    </th>
                    <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                      Dinsdag
                    </th>
                    <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                      Woensdag
                    </th>
                    <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                      Donderdag
                    </th>
                    <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                      Vrijdag
                    </th>
                    <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                      Zaterdag
                    </th>
                    <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-600 text-center">
                      Zondag
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {data.map((day, i) => (
                    <tr key={i}>
                      <td className="border-b border-slate-100 p-4 pl-8 w-full text-slate-700">
                        <Select
                          options={options}
                          defaultValue={
                            day.id && {
                              value: day.id,
                              label: users.data.find((u) => u.id === day.id)
                                ?.name,
                            }
                          }
                          onChange={(c) =>
                            setData([
                              ...data.slice(0, i),
                              {
                                ...day,
                                id:
                                  c && typeof c !== 'string' ? c.value : false,
                              },
                              ...data.slice(i + 1),
                            ])
                          }
                          menuPortalTarget={document.body}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          placeholder={day.name}
                          isSearchable
                        />
                      </td>
                      <td className="border-b border-slate-100 p-4 pr-8 text-center text-slate-700">
                        {day.monday}
                      </td>
                      <td className="border-b border-slate-100 p-4 pr-8 text-center text-slate-700">
                        {day.tuesday}
                      </td>
                      <td className="border-b border-slate-100 p-4 pr-8 text-center text-slate-700">
                        {day.wednesday}
                      </td>
                      <td className="border-b border-slate-100 p-4 pr-8 text-center text-slate-700">
                        {day.thursday}
                      </td>
                      <td className="border-b border-slate-100 p-4 pr-8 text-center text-slate-700">
                        {day.friday}
                      </td>
                      <td className="border-b border-slate-100 p-4 pr-8 text-center text-slate-700">
                        {day.saturday}
                      </td>
                      <td className="border-b border-slate-100 p-4 pr-8 text-center text-slate-700">
                        {day.sunday}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none border border-black/5 rounded-xl"></div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-lg text-slate-600">
            Selecteer eerst een bestand om te importeren.
          </p>
        </div>
      )}
    </>
  );
};
ImportPage.getLayout = (page: ReactElement) => (
  <AdminLayout>{page}</AdminLayout>
);
ImportPage.requireAuth = true;

export default ImportPage;
