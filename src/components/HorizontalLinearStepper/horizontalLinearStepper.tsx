import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { OptionalStep, StepSequence } from './step.types';
import { CircularProgress } from '@mui/material';

type StepperButtons = {
  back?: { buttonName?: string };
  skip?: { buttonName?: string };
  next?: { buttonName?: string };
  finish?: { buttonName?: string; action?: () => Promise<boolean> };
  reset?: { buttonName?: string; action?: () => void };
};

type HorizontalLinearStepperProps = {
  steps: StepSequence;
  className?: string;
  buttons?: StepperButtons;
  startStep: number;
  onStepChange?: (step: number) => void;
};

export const HorizontalLinearStepper: React.FC<HorizontalLinearStepperProps> = ({ steps, buttons, onStepChange, className, startStep }) => {
  const [activeStep, setActiveStep] = React.useState(startStep);
  const [isLoading, setIsLoading] = React.useState(false);
  const [skipped, setSkipped] = React.useState(new Set<number>());
  const { back, skip, next, finish, reset } = buttons ?? {};

  const isStepOptional = (step: number): boolean => {
    const stepObj = steps[step] as OptionalStep;
    return stepObj.isOptional ?? false;
  };

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = async () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    let success = steps[activeStep].isValid;
    if (activeStep === steps.length - 1) {
      if (finish?.action) {
        setIsLoading(true);
        success = await finish.action();
        setIsLoading(false);
      }
    }
    if (!(success ?? false)) {
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
    onStepChange && onStepChange(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    onStepChange && onStepChange(activeStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      return;
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
    onStepChange && onStepChange(0);
    reset?.action && reset.action();
  };

  return (
    <Box sx={{ width: '100%' }} className={className}>
      <Stepper activeStep={activeStep}>
        {steps.map((step, index) => {
          const stepProps: { completed?: boolean } = {};
          const labelProps: {
            optional?: React.ReactNode;
          } = {};
          if (isStepOptional(index)) {
            labelProps.optional = <Typography variant="caption">Optional</Typography>;
          }
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={step.label} {...stepProps}>
              <StepLabel {...labelProps}>{step.label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
      {activeStep === steps.length ? (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>All steps completed - you&apos;re finished</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={handleReset}>{reset?.buttonName ?? 'Reset'}</Button>
          </Box>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>Step {activeStep + 1}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Button disabled={isLoading || activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
              {back?.buttonName ?? 'Back'}
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {isStepOptional(activeStep) && (
              <Button onClick={handleSkip} sx={{ mr: 1 }}>
                {skip?.buttonName ?? 'Skip'}
              </Button>
            )}
            {isLoading ? (
              <CircularProgress />
            ) : (
              <Button disabled={!(steps[activeStep].isValid ?? false)} onClick={handleNext}>
                {activeStep === steps.length - 1 ? finish?.buttonName ?? 'Finish' : next?.buttonName ?? 'Next'}
              </Button>
            )}
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
};
