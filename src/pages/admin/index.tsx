import { useRouter } from 'next/router';
import { ReactElement, useContext, useState } from 'react';
import { AdminDateContext, AdminLayout } from '~/components/AdminLayout';
import BreakComponent from '~/components/BreakComponent';
import CommunicationComponent from '~/components/CommunicationComponent';
import Planningpage from '~/components/PlanningPage';
import Stepper from '~/components/Stepper';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const IndexPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { step } = router.query;
  const date = useContext(AdminDateContext);
  const context = trpc.useContext();
  const mutateLock = trpc.useMutation(['planning.lockbyDate'], {
    onSuccess: () => {
      context.invalidateQueries('planning.isLocked');
    },
  });
  const isLockedQuery = trpc.useQuery(['planning.isLocked', { date }]);
  const [currentStep, setCurrentStep] = useState(
    step ? parseInt(step as string) : 1,
  );
  const stepArray = [
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
      router.replace({
        query: { ...router.query, step: newStep.toString() },
      });
    }
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber > 0 && stepNumber <= stepArray.length) {
      setCurrentStep(stepNumber);
      router.replace({
        query: { ...router.query, step: stepNumber.toString() },
      });
    }
  };

  const isLocked = isLockedQuery.data || false;

  return (
    <>
      <div className="container horizontal">
        <Stepper
          steps={stepArray}
          currentStepNumber={currentStep}
          onClick={handleStepClick}
        />
      </div>
      <div className="container my-8 pt-4">
        {currentStep == 1 && (
          <div className="text-center px-10">
            <h2 className="text-2xl m-5">
              {isLocked ? 'Ontgrendel' : 'Vergrendel'} planning
            </h2>
            <p>
              Je staat op het punt de planning van {date.toLocaleDateString()}{' '}
              te {isLocked ? 'ontgrendelen' : 'vergrendelen'}.
            </p>
            {isLocked ? (
              <p>Dit betekend dat de planning weer gewijzigd kan worden.</p>
            ) : (
              <p>Dit betekend dat niemand de planning meer kan wijzigen.</p>
            )}
            <button
              onClick={() =>
                mutateLock.mutateAsync({ date, locked: !isLocked })
              }
              disabled={
                mutateLock.status !== 'idle' && mutateLock.status !== 'success'
              }
              className={`mt-7 btn-primary transition duration-300 ease-in-out focus:outline-none focus:shadow-outline ${
                isLocked
                  ? 'bg-green-700 hover:bg-green-900'
                  : 'bg-red-700 hover:bg-red-900'
              } text-white font-normal py-2 px-4 mr-1 rounded`}
            >
              {isLocked ? 'Ontgrendel' : 'Vergrendel'} planning
            </button>
          </div>
        )}
        {currentStep == 2 && <CommunicationComponent date={date} />}
        {currentStep == 3 && <BreakComponent date={date} />}
        {currentStep == 4 && <Planningpage date={date} />}
      </div>
      <div className="container flex justify-around my-8 ">
        {currentStep > 1 ? (
          <button
            onClick={() => handleClick()}
            className="btn-primary transition duration-300 ease-in-out focus:outline-none focus:shadow-outline bg-blue-700 hover:bg-blue-900 text-white font-normal py-2 px-4 mr-1 rounded"
          >
            Vorige
          </button>
        ) : (
          <div />
        )}
        {currentStep < 5 ? (
          <button
            onClick={() => handleClick('next')}
            className="btn-outline-primary transition duration-300 ease-in-out focus:outline-none focus:shadow-outline border border-blue-700 hover:bg-blue-700 text-blue-700 hover:text-white font-normal py-2 px-4 rounded"
          >
            Volgende
          </button>
        ) : (
          <div />
        )}
      </div>
    </>
  );
};

IndexPage.getLayout = (page: ReactElement) => (
  <AdminLayout hasDate={true}>{page}</AdminLayout>
);
IndexPage.requireAuth = true;

export default IndexPage;
