import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { MinusCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CORE_COLUMNS } from '../../constants';

interface CsvCleanupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: string[];
  rows: Record<string, unknown>[];
  onRemoveColumn: (column: string) => void;
  onRemoveRow: (rowIndex: number) => void;
  onContinue: () => void;
  onCancel: () => void;
}

export const CsvCleanupDialog = ({
  open,
  onOpenChange,
  columns,
  rows,
  onRemoveColumn,
  onRemoveRow,
  onContinue,
  onCancel,
}: CsvCleanupDialogProps) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) onCancel();
      }}
    >
      <DialogContent className="bg-white text-black border border-gray-300 shadow-2xl max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Review CSV (remove rows / columns)</DialogTitle>
          <DialogDescription>
            Hover a column header or row number to remove it before choosing demographic columns.
            <span className="block mt-1 text-xs text-gray-500">
              Note: <code>selectionsData</code> and <code>image</code> can't be removed because they're required for annotations.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              Columns: <b>{columns.length}</b> · Rows: <b>{rows.length}</b>
            </span>
            {rows.length > 50 && (
              <span className="text-gray-500">Showing first 50 rows</span>
            )}
          </div>

          <div className="flex-1 overflow-auto border rounded bg-white">
            <table className="min-w-max text-xs">
              <thead className="sticky top-0 z-10 bg-white">
                <tr>
                  <th className="sticky left-0 z-20 bg-white border-b border-r px-2 py-2 text-gray-500">
                    #
                  </th>
                  {columns.map((column) => {
                    const isRequired = column === 'selectionsData' || column === 'image';
                    return (
                      <th
                        key={column}
                        className={cn(
                          "group relative border-b border-r px-3 py-2 text-left whitespace-nowrap",
                          isRequired ? "text-gray-700" : "text-gray-900"
                        )}
                        title={column}
                      >
                        <span className="font-semibold">{column}</span>
                        {!isRequired && (
                          <button
                            type="button"
                            className={cn(
                              "absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity",
                              "text-red-600 hover:text-red-700"
                            )}
                            onClick={() => onRemoveColumn(column)}
                            aria-label={`Remove column ${column}`}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </button>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, rowIndex) => (
                  <tr key={rowIndex} className="group hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white border-b border-r px-2 py-2 text-gray-500">
                      <div className="relative pr-5">
                        <span>{rowIndex + 1}</span>
                        <button
                          type="button"
                          className={cn(
                            "absolute right-0 top-1/2 -translate-y-1/2",
                            "opacity-0 group-hover:opacity-100 transition-opacity",
                            "text-red-600 hover:text-red-700"
                          )}
                          onClick={() => onRemoveRow(rowIndex)}
                          aria-label={`Remove row ${rowIndex + 1}`}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    {columns.map((column) => {
                      const raw = (row as Record<string, unknown>)[column];
                      const display = raw === undefined || raw === null ? "" : `${raw}`;
                      return (
                        <td
                          key={column}
                          className="border-b border-r px-3 py-2 max-w-[260px] truncate"
                          title={display}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-6 text-center text-sm text-gray-500"
                      colSpan={Math.max(1, columns.length + 1)}
                    >
                      No rows to display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onCancel} className="hover:bg-[#e9e9e9]">
            Cancel
          </Button>
          <Button
            onClick={onContinue}
            disabled={columns.length === 0 || rows.length === 0}
            className="bg-black text-white hover:bg-[#333]"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
