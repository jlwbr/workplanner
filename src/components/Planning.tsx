import Table from './Table';

const Plus = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-gray-800"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

type Props = {
  editable?: boolean;
};

const Planning = ({ editable = true }: Props) => {
  return (
    <>
      <div className="flex justify-between py-3 px-10 items-center">
        <h1 className="text-lg font-medium">Ochtend</h1>
      </div>
      <Table />
      <div className="flex justify-between py-3 px-10 items-center">
        <h1 className="text-lg font-medium">Middag</h1>
        {editable && <Plus />}
      </div>
      <Table />
      <div className="flex justify-between py-3 px-10 items-center">
        <h1 className="text-lg font-medium">Avond</h1>
        {editable && <Plus />}
      </div>
      <Table />
      <div className="flex py-3 px-10 items-center place-content-end">
        {editable && <Plus />}
      </div>
    </>
  );
};

export default Planning;
