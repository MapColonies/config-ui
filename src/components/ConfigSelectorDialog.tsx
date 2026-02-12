import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  ConfigSelector,
  type SelectedConfig,
} from "@/components/ConfigSelector";

type ConfigSelectorDialogProps = {
  trigger: React.ReactNode;
  title: string;
  description?: string | React.ReactNode;
  onSelect: (config: SelectedConfig) => void;
  confirmLabel?: string;
  selectorLabel?: string;
  initialValue?: SelectedConfig;
  validateSelection?: (config: SelectedConfig | undefined) => boolean;
  disabledTooltip?: string | ((config: SelectedConfig | undefined) => string);
  // Optional controlled mode
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ConfigSelectorDialog({
  trigger,
  title,
  description,
  onSelect,
  confirmLabel = "Select",
  selectorLabel = "Select Config",
  initialValue,
  validateSelection,
  disabledTooltip,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ConfigSelectorDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<
    SelectedConfig | undefined
  >(initialValue);

  // Use controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  // When dialog opens or initialValue changes, update selection
  useEffect(() => {
    if (isOpen) {
      setSelectedConfig(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleConfirm = () => {
    if (selectedConfig && isConfirmEnabled) {
      onSelect(selectedConfig);
      setIsOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset to initial value (not undefined) so it persists on reopen
      setSelectedConfig(initialValue);
    }
  };

  // Validate selection if validator provided
  const isSelectionValid = validateSelection
    ? validateSelection(selectedConfig)
    : true;

  // Button enabled if: has selection AND passes validation
  const isConfirmEnabled = !!selectedConfig && isSelectionValid;

  // Get tooltip text (can be string or function)
  const getTooltipText = () => {
    if (!disabledTooltip) return undefined;
    return typeof disabledTooltip === "function"
      ? disabledTooltip(selectedConfig)
      : disabledTooltip;
  };

  const tooltipText = getTooltipText();
  const showTooltip = !isConfirmEnabled && !!tooltipText;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">
          <ConfigSelector
            value={selectedConfig}
            onChange={setSelectedConfig}
            label={selectorLabel}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button onClick={handleConfirm} disabled={!isConfirmEnabled}>
                    {confirmLabel}
                  </Button>
                </span>
              </TooltipTrigger>
              {showTooltip && (
                <TooltipContent>
                  <p>{tooltipText}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
