import { useRouter } from 'next/router';
import { ReactElement, useContext, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AdminDateContext, AdminLayout } from '~/components/AdminLayout';
import AsigneeBadge from '~/components/AsigneeBadge';
import BreakComponent from '~/components/BreakComponent';
import CommunicationComponent from '~/components/CommunicationComponent';
import KanbanComponent from '~/components/KanbanComponent';
import Planningpage from '~/components/PlanningPage';
import Stepper from '~/components/Stepper';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const IndexPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { step } = router.query;
  const date = useContext(AdminDateContext);
  const context = trpc.useContext();
  const userQuery = trpc.useQuery(['user.all']);
  const scheduleQuery = trpc.useQuery(['schedule.getAll', { date: date }]);
  const mutateLock = trpc.useMutation(['planning.lockbyDate'], {
    onSuccess: () => {
      context.invalidateQueries('planning.isLocked');
    },
  });
  const isLockedQuery = trpc.useQuery(['planning.isLocked', { date }]);
  const [currentStep, setCurrentStep] = useState(
    step ? parseInt(step as string) : 1,
  );
  const [open, setOpen] = useState(false);
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
  const users = userQuery.data || [];
  const schedule = scheduleQuery.data || [];

  const options =
    schedule && schedule.length > 0
      ? schedule.map((user) => ({
          value: user.userId,
          label: `${
            user.user?.name || `Anoniem (${user.userId.slice(0, 4)})`
          } (${user.schedule})`,
        }))
      : users.map((user) => ({
          value: user.id,
          label: user.name || `Anoniem (${user.id.slice(0, 4)})`,
        }));

  const excess =
    schedule &&
    schedule.length > 0 &&
    users
      .filter((user) => !schedule.find((s) => s.userId === user.id))
      .map((user) => ({
        value: user.id,
        label: user.name || `Anoniem (${user.id.slice(0, 4)})`,
      }));

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
          <DndProvider backend={HTML5Backend}>
            <div className="flex flex-wrap gap-2 p-5">
              {options.map((option) => (
                <AsigneeBadge
                  key={option.value}
                  canRemove={false}
                  name={option.label}
                  asigneeId={option.value}
                  draggable={true}
                />
              ))}
              {excess &&
                open &&
                excess.map((option) => (
                  <AsigneeBadge
                    key={option.value}
                    canRemove={false}
                    name={option.label}
                    asigneeId={option.value}
                    draggable={true}
                  />
                ))}
              {excess && (
                <button
                  onClick={() => setOpen(!open)}
                  className="text-xs inline-flex items-center font-bold leading-sm px-3 py-1 bg-gray-200 text-gray-700 rounded-full whitespace-nowrap"
                >
                  {open ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
            <div
              style={{
                width: `calc(100vw - 19rem)`,
                height: `100vh`,
                overflow: 'auto',
              }}
            >
              <KanbanComponent date={date} isAdmin={true} />
            </div>
          </DndProvider>
        )}
        {currentStep == 2 && (
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
        {currentStep == 3 && <CommunicationComponent date={date} />}
        {currentStep == 4 && <BreakComponent date={date} />}
        {currentStep == 5 && <Planningpage date={date} />}
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
