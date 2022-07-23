import { useRouter } from 'next/router';
import { ReactElement, useContext, useState } from 'react';
import { HiLockClosed, HiLockOpen, HiOutlineExclamation } from 'react-icons/hi';
import { AdminDateContext, AdminLayout } from '~/components/AdminLayout';
import CommsBreakComponent from '~/components/CommsBreakComponent';
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
  const planing = trpc.useQuery(['planning.byDate', { date }]);
  const [currentStep, setCurrentStep] = useState(
    step ? parseInt(step as string) : 1,
  );
  const stepArray = [
    'Vergrendel planning',
    'Communicatiemiddelen & Pauzes',
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

  const errors =
    planing.data?.flatMap((p) =>
      p.PlanningItem.filter((i) => {
        const isFilled =
          (i.morningAsignee.length > 0 ||
            i.afternoonAsignee.length > 0 ||
            i.eveningAsignee.length > 0) &&
          i.description.length > 0;

        return (i.important && !isFilled) || (i.ownerId && !isFilled);
      }).map((i) => i.name),
    ) || [];

  const isLocked = isLockedQuery.data || false;

  return (
    <>
      <div className="hidden md:block container horizontal">
        <Stepper
          steps={stepArray}
          currentStepNumber={currentStep}
          onClick={handleStepClick}
        />
      </div>
      <div className="container my-8 md:pt-4">
        {currentStep == 1 && (
          <div className="text-center px-10">
            <div className="flex items-center gap-2 justify-center m-5">
              {isLocked ? (
                <>
                  <HiLockClosed className="h-6 w-6" />
                  <h2 className="text-2xl">Vergrendeld</h2>
                </>
              ) : (
                <>
                  <HiLockOpen className="h-6 w-6" />
                  <h2 className="text-2xl">Open</h2>
                </>
              )}
            </div>
            <p>
              Je staat op het punt de planning van {date.toLocaleDateString()}{' '}
              te {isLocked ? 'ontgrendelen' : 'vergrendelen'}.
            </p>
            {isLocked ? (
              <p>Dit betekend dat de planning weer gewijzigd kan worden.</p>
            ) : (
              <p>Dit betekend dat niemand de planning meer kan wijzigen.</p>
            )}
            {errors && (
              <div className="flex items-center justify-center mt-5">
                <div
                  className="bg-red-100 border-red-500 rounded-md text-red-900 px-4 py-3 border-2 text-left"
                  role="alert"
                >
                  <div className="flex gap-2">
                    <div className="py-1">
                      <HiOutlineExclamation className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-bold text-center">
                        De volgende omlijnde velden zijn niet ingevuld!
                      </p>
                      <p className="text-sm text-center">{errors.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() =>
                mutateLock.mutateAsync({ date, locked: !isLocked })
              }
              disabled={
                mutateLock.status !== 'idle' && mutateLock.status !== 'success'
              }
              className="mt-7 btn-primary transition duration-300 ease-in-out focus:outline-none focus:shadow-outline bg-blue-200 text-blue-700 font-normal py-2 px-4 mr-1 rounded"
            >
              {isLocked ? 'Open' : 'Vergrendel'} planning
            </button>
          </div>
        )}
        {currentStep == 2 && <CommsBreakComponent date={date} />}
        {currentStep == 3 && <Planningpage date={date} />}
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
        {currentStep < stepArray.length ? (
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
