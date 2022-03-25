const Table = () => {
  return (
    <table className="border-collapse table-auto w-full text-sm rounded-lg">
      <thead className="text-gray-800 bg-gray-50 border-b-2 border-t">
        <tr>
          <th className="px-6 py-3">Naam</th>
          <th className="px-6 py-3">Taak</th>
          <th className="px-6 py-3">Opmerkingen</th>
          <th className="px-6 py-3">Telefoon</th>
          <th className="px-6 py-3">Oortje</th>
        </tr>
      </thead>
      <tbody className="text-center">
        <tr>
          <td className="border-b px-6 py-3">Joel</td>
          <td className="border-b px-6 py-3">Vullen</td>
          <td className="border-b px-6 py-3">
            Zorg dat alle vulling er op tijd in zit, klanten gaan natuurlijk
            voor
          </td>
          <td className="border-b px-6 py-3">1</td>
          <td className="border-b px-6 py-3">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

{
  /* <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
<table className="table-auto w-full text-sm text-left text-gray-500">
  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
    <tr>
      <th scope="col" className="px-6 py-3">
        Naam
      </th>
      <th scope="col" className="px-6 py-3">
        Taak
      </th>
      <th scope="col" className="px-6 py-3">
        Opmerkingen
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="bg-white border-b ">
      <th
        scope="row"
        className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
      >
        Piet
      </th>
      <td className="px-6 py-4">Vullen</td>
      <td className="px-6 py-4">Doe goed!</td>
    </tr>
  </tbody>
</table>
</div> */
}

export default Table;
