import { ReactElement, useContext, useState } from 'react';
import { AdminDateContext, AdminLayout } from '~/components/AdminLayout';
import BreakComponent from '~/components/BreakComponent';
import CommunicationComponent from '~/components/CommunicationComponent';
import KanbanComponent from '~/components/KanbanComponent';
import Planningpage from '~/components/PlanningPage';
import Stepper from '~/components/Stepper';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const IndexPage: NextPageWithLayout = () => {
  const date = useContext(AdminDateContext);
  const mutateLock = trpc.useMutation(['planning.lockbyDate']);
  const [currentStep, setCurrentStep] = useState(1);
  const stepArray = [
    'Planning',
    'Vergrendel planning',
    'Communicatiemiddelen',
    'Pauzes',
    'Print',
  ];
  const handleClick = (clickType?: string) => {
    let newStep = currentStep;
    clickType == 'next' ? newStep++ : newStep--;
    // Check if steps are within the boundary
    if (newStep > 0 && newStep <= stepArray.length) {
      setCurrentStep(newStep);
    }
  };
  return (
    <>
      <div className="container horizontal">
        <Stepper steps={stepArray} currentStepNumber={currentStep} />
      </div>
      <div className="container flex justify-around my-8 pt-4">
        {currentStep == 1 && <KanbanComponent date={date} isAdmin={true} />}
        {currentStep == 2 && (
          <div className="text-center px-10">
            <h2 className="text-2xl m-5">Vergrendel planning</h2>
            <p>
              Je staat op het punt de planning van {date.toLocaleDateString()}{' '}
              te vergrendelen.
            </p>
            <p>
              Dit is definitief en betekend dat niemand de planning meer kan
              wijzigen.
            </p>
            <button
              onClick={() => mutateLock.mutateAsync({ date })}
              className="mt-7 btn-primary transition duration-300 ease-in-out focus:outline-none focus:shadow-outline bg-blue-700 hover:bg-blue-900 text-white font-normal py-2 px-4 mr-1 rounded"
            >
              Vergrendel planning
            </button>
          </div>
        )}
        {currentStep == 3 && <CommunicationComponent date={date} />}
        {currentStep == 4 && <BreakComponent date={date} />}
        {currentStep == 5 && <Planningpage date={date} />}
      </div>
      <div className="container flex justify-around my-8 ">
        <button
          onClick={() => handleClick()}
          className="btn-primary transition duration-300 ease-in-out focus:outline-none focus:shadow-outline bg-blue-700 hover:bg-blue-900 text-white font-normal py-2 px-4 mr-1 rounded"
        >
          Vorige
        </button>
        <button
          onClick={() => handleClick('next')}
          className="btn-outline-primary transition duration-300 ease-in-out focus:outline-none focus:shadow-outline border border-blue-700 hover:bg-blue-700 text-blue-700 hover:text-white font-normal py-2 px-4 rounded"
        >
          Volgende
        </button>
      </div>
    </>
  );
};

IndexPage.getLayout = (page: ReactElement) => (
  <AdminLayout hasDate={true}>{page}</AdminLayout>
);
IndexPage.requireAuth = true;

export default IndexPage;
