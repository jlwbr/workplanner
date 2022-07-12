import { HiExclamation } from 'react-icons/hi';
import { QueryObserverSuccessResult, UseQueryResult } from 'react-query';

const swallowQuery = <T,>(
  query: UseQueryResult<T>,
):
  | [QueryObserverSuccessResult<T>['data'], true, undefined]
  | [undefined, false, JSX.Element] => {
  if (query.isLoading) return [undefined, false, Loading()];
  if (query.isError)
    return [undefined, false, Error({ text: 'Kon data niet ophalen' })];

  if (query.isSuccess) return [query.data, true, undefined];

  return [undefined, false, Error({ text: 'Onverwachte error' })];
};

const Loading = () => (
  <div className="flex flex-col items-center justify-center h-[60vh]">
    <svg
      className="animate-spin -ml-1 mr-3 h-20 w-20 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>
);

const Error = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh]">
    <HiExclamation className="mr-3 h-20 w-20 text-white" />
    <h2 className="text-lg">{text}</h2>
  </div>
);

export default swallowQuery;
