import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

interface DemographicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: 'select' | 'rename';
  availableColumns: string[];
  pendingColumns: string[];
  pendingLabels: Record<string, string>;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onToggleColumn: (column: string) => void;
  onToggleAllColumns: () => void;
  onLabelChange: (column: string, label: string) => void;
  onStepChange: (step: 'select' | 'rename') => void;
  onConfirm: () => void;
  canProceed: boolean;
}

export const DemographicModal = ({
  open,
  onOpenChange,
  step,
  availableColumns,
  pendingColumns,
  pendingLabels,
  searchTerm,
  onSearchChange,
  onToggleColumn,
  onToggleAllColumns,
  onLabelChange,
  onStepChange,
  onConfirm,
  canProceed,
}: DemographicModalProps) => {
  const filteredColumns = availableColumns.filter((column) =>
    column.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-black border border-gray-300 shadow-2xl max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? 'Choose demographic columns' : 'Rename demographic columns'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? 'Pick which CSV columns should become User Demographic filters.'
              : 'Optionally rename the selected columns to friendly labels.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 border p-2 rounded text-sm"
                placeholder="Search columns"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
              />
              <Button variant="outline" onClick={onToggleAllColumns} className="text-xs px-3 py-2">
                {pendingColumns.length === availableColumns.length ? 'Clear all' : 'Select all'}
              </Button>
            </div>

            <div className="max-h-64 overflow-auto border rounded bg-[#fafafa] p-2 flex flex-col gap-2">
              {filteredColumns.map((column) => {
                const checked = pendingColumns.includes(column);
                return (
                  <label
                    key={column}
                    className="flex items-center gap-2 text-sm cursor-pointer rounded px-2 py-1 hover:bg-[#e9e9e9]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleColumn(column)}
                      className="accent-black"
                    />
                    <span className="truncate" title={column}>{column}</span>
                  </label>
                );
              })}

              {filteredColumns.length === 0 && (
                <span className="text-xs text-gray-500">
                  {availableColumns.length === 0
                    ? 'No additional columns were detected in this CSV.'
                    : 'No columns match your search.'}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-600">
              Selected {pendingColumns.length} / {availableColumns.length}
            </span>
          </div>
        )}

        {step === 'rename' && (
          <div className="flex flex-col gap-3 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-2 max-h-[55vh]">
              <div className="flex flex-col gap-3">
                {pendingColumns.map((column) => (
                  <div key={column} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-600">CSV Column: {column}</span>
                    <input
                      className="border p-2 rounded"
                      value={pendingLabels[column] || ''}
                      onChange={(event) => onLabelChange(column, event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          {step === 'rename' && (
            <Button
              variant="outline"
              onClick={() => onStepChange('select')}
              className="hover:bg-[#e9e9e9]"
            >
              Back
            </Button>
          )}
          <Button
            disabled={step === 'select' && !canProceed}
            onClick={step === 'select' ? () => onStepChange('rename') : onConfirm}
            className="bg-black text-white hover:bg-[#333]"
          >
            {step === 'select' ? 'Next' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
