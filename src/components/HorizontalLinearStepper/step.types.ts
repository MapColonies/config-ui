type MandatoryStep = {
  label: string;
  isValid?: boolean;
  component: React.ReactNode;
};

export type OptionalStep = MandatoryStep & { isOptional?: boolean };
export type Step = OptionalStep | MandatoryStep;
export type StepSequence = [OptionalStep, ...OptionalStep[], MandatoryStep];
