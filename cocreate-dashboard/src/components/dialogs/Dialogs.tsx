import { useDashboardContext } from '../../contexts/DashboardContext';
import { CsvCleanupDialog } from './CsvCleanupDialog';
import { DemographicModal } from './DemographicModal';
import { ExecutiveSummaryImportDialog } from './ExecutiveSummaryImportDialog';

export const Dialogs = () => {
  const dashboard = useDashboardContext();

  return (
    <>
      <CsvCleanupDialog
        open={dashboard.csvImport.csvCleanupOpen}
        onOpenChange={dashboard.csvImport.setCsvCleanupOpen}
        columns={dashboard.csvImport.csvCleanupColumns}
        rows={dashboard.csvImport.csvCleanupRows}
        onRemoveColumn={dashboard.csvImport.removeCsvColumn}
        onRemoveRow={dashboard.csvImport.removeCsvRow}
        onContinue={dashboard.csvImport.applyCsvCleanupAndContinue}
        onCancel={dashboard.csvImport.resetCsvCleanupState}
      />

      <DemographicModal
        open={dashboard.demographics.demographicModalOpen}
        onOpenChange={dashboard.demographics.setDemographicModalOpen}
        step={dashboard.demographics.demographicModalStep}
        availableColumns={dashboard.demographics.availableDemographicColumns}
        pendingColumns={dashboard.demographics.pendingDemographicColumns}
        pendingLabels={dashboard.demographics.pendingDemographicLabels}
        searchTerm={dashboard.demographics.demographicSearchTerm}
        onSearchChange={dashboard.demographics.setDemographicSearchTerm}
        onToggleColumn={dashboard.demographics.togglePendingColumn}
        onToggleAllColumns={dashboard.demographics.toggleAllPendingColumns}
        onLabelChange={(column, label) =>
          dashboard.demographics.setPendingDemographicLabels({
            ...dashboard.demographics.pendingDemographicLabels,
            [column]: label
          })
        }
        onStepChange={dashboard.demographics.setDemographicModalStep}
        onConfirm={dashboard.demographics.handleConfirmDemographics}
        canProceed={dashboard.demographics.pendingDemographicColumns.length > 0}
      />

      <ExecutiveSummaryImportDialog
        open={dashboard.executiveSummary.execSummaryImportOpen}
        onOpenChange={dashboard.executiveSummary.setExecSummaryImportOpen}
        text={dashboard.executiveSummary.execSummaryImportText}
        error={dashboard.executiveSummary.execSummaryImportError}
        textareaRef={dashboard.executiveSummary.execSummaryTextareaRef}
        onTextChange={dashboard.executiveSummary.setExecSummaryImportText}
        onImport={dashboard.executiveSummary.importExecutiveSummaryFromText}
        onCancel={() => {
          dashboard.executiveSummary.setExecSummaryImportError(null);
          dashboard.executiveSummary.setExecSummaryImportText('');
        }}
      />
    </>
  );
};
