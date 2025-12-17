import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

interface ExecutiveSummaryImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  error: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onTextChange: (text: string) => void;
  onImport: () => void;
  onCancel: () => void;
}

export const ExecutiveSummaryImportDialog = ({
  open,
  onOpenChange,
  text,
  error,
  textareaRef,
  onTextChange,
  onImport,
  onCancel,
}: ExecutiveSummaryImportDialogProps) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent className="bg-white text-black border border-gray-300 shadow-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Executive Summary JSON</DialogTitle>
          <DialogDescription>
            Paste JSON with keys: <code>summary</code>, <code>analysis</code>, <code>strengths</code>, <code>improvements</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            rows={10}
            placeholder={`{\n  "summary": "...",\n  "analysis": ["..."],\n  "strengths": "...",\n  "improvements": "..."\n}`}
            className="w-full border rounded p-2 text-sm font-mono bg-white"
          />
          {error && (
            <span className="text-xs text-red-600">{error}</span>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="hover:bg-[#e9e9e9]"
          >
            Cancel
          </Button>
          <Button
            onClick={onImport}
            className="bg-black text-white hover:bg-[#333]"
          >
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
