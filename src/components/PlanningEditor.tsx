/* This example requires Tailwind CSS v2.0+ */
import { Fragment, HTMLInputTypeAttribute } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlanningItem, PlanningRule } from '@prisma/client';
import { inferMutationInput } from '~/utils/trpc';

// TODO: find a more typescript friendly way to do this
export type PlanningInputsType = {
  field: keyof PlanningItem | keyof PlanningRule;
  label: string;
  input: HTMLInputTypeAttribute | 'textarea' | 'select';
  placeholder?: string;
  values?: () => { id: string; name: string }[];
}[];

type PlanningEditorType = {
  open: boolean;
  onClose: (cancel?: boolean) => any;
  value:
    | inferMutationInput<'planning.tasks.upsert'>
    | inferMutationInput<'planning.rules.upsert'>;
  onChange: (
    value:
      | inferMutationInput<'planning.tasks.upsert'>
      | inferMutationInput<'planning.rules.upsert'>,
  ) => void;
  inputs: PlanningInputsType;
  onDelete: (id: string) => void;
};

const PlanningEditor = ({
  open,
  onClose,
  value,
  onChange,
  inputs,
  onDelete,
}: PlanningEditorType) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-10 inset-0 overflow-y-auto"
        // FIXME: we don't want the dialog to be closable using anything other than the close button
        // for now, an empty arror function is fine, but ther might be a better solution
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onClose={() => {}}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mt-3 sm:mt-0 text-left">
                  <Dialog.Title
                    as="h3"
                    className="text-lg leading-6 font-medium text-gray-900 pb-2"
                  >
                    {(value && value['name'] && `Taak: ${value['name']}`) ||
                      'Nieuwe taak'}
                  </Dialog.Title>
                  <div className="mt-2">
                    {inputs.map((input) => (
                      <div key={input.field} className="pb-4">
                        <label
                          htmlFor={input.field}
                          className="block mb-2 text-sm font-medium text-gray-900"
                        >
                          {input.label}
                        </label>
                        {(input.input == 'select' && (
                          <div className="inline-block relative w-full">
                            <select
                              name={input.field}
                              id={input.field}
                              // TODO: This is ugly, but it works
                              value={(value as any)[input.field] || ''}
                              placeholder={input.placeholder}
                              onChange={(event) =>
                                onChange({
                                  ...value,
                                  [input.field]: event.target.value,
                                })
                              }
                              className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 text-gray-900 rounded leading-tight focus:outline-none focus:shadow-outline"
                            >
                              <option value="" className="hidden" />
                              {input.values &&
                                input.values().map(({ id, name }) => (
                                  <option key={id} value={id}>
                                    {name}
                                  </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-900">
                              <svg
                                className="fill-current h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                              </svg>
                            </div>
                          </div>
                        )) ||
                          (input.input == 'textarea' && (
                            <textarea
                              id={input.field}
                              name={input.field}
                              // TODO: This is ugly, but it works
                              value={(value as any)[input.field] || ''}
                              placeholder={input.placeholder}
                              onChange={(event) =>
                                onChange({
                                  ...value,
                                  [input.field]: event.target.value,
                                })
                              }
                              rows={4}
                              cols={50}
                              className="bg-white border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            ></textarea>
                          )) ||
                          (input.input == 'checkbox' && (
                            <input
                              type={input.input}
                              name={input.field}
                              // TODO: This is ugly, but it works
                              checked={(value as any)[input.field] || false}
                              placeholder={input.placeholder}
                              onChange={() =>
                                onChange({
                                  ...value,
                                  [input.field]: !(value as any)[input.field],
                                })
                              }
                              id={input.field}
                              className="bg-white border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            />
                          )) || (
                            <input
                              type={input.input}
                              name={input.field}
                              min="0"
                              // TODO: This is ugly, but it works
                              value={(value as any)[input.field] || ''}
                              placeholder={input.placeholder}
                              onChange={(event) =>
                                onChange({
                                  ...value,
                                  [input.field]:
                                    input.input == 'number'
                                      ? parseInt(event.target.value) || 0
                                      : event.target.value,
                                })
                              }
                              id={input.field}
                              className="bg-white border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            />
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => onClose()}
                >
                  Opslaan
                </button>
                {value.id && (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => value.id && onDelete(value.id)}
                  >
                    Verwijder
                  </button>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => onClose(true)}
                >
                  Annuleer
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default PlanningEditor;
