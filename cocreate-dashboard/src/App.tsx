import { useState, useEffect } from 'react';
import './App.css';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable';
import { Selection } from './types/global';
import { DashboardProvider, useDashboardContext } from './contexts/DashboardContext';
import Header from './components/layout/Header';
import { Sidebar } from './components/features/Sidebar';
import { AnnotationView } from './components/features/AnnotationView';
import { ExecutiveSummary } from './components/features/ExecutiveSummary';
import { FeedbackComments } from './components/features/FeedbackComments';
import { Dialogs } from './components/dialogs/Dialogs';
import { getContainedSelections } from './utils/selection-utils';
import { applyDemographicFilters, getVisibleAnnotationIndex } from './utils/annotation-utils';

function AppContent({ onActiveSelectionChange }: { onActiveSelectionChange: (selection: Selection | null) => void }) {
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState<boolean>(true);
  const [showThumbnailHeatmap, setShowThumbnailHeatmap] = useState<boolean>(true);
  const [selectedViewMode, setSelectedViewMode] = useState<"selection" | "heatmap" | "flatHeatmap">("flatHeatmap");
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [activeSelection, setActiveSelection] = useState<Selection | null>(null);

  // Access dashboard state from context
  const dashboard = useDashboardContext();

  // Sync local activeSelection with parent
  const handleSelectionChange = (selection: Selection | null) => {
    setActiveSelection(selection);
    onActiveSelectionChange(selection);
  };

  // Apply demographic filters when feedback filters change
  useEffect(() => {
    if (dashboard.annotations.baseAggregatedAnnotations.length > 0) {
      const withDemographicFilters = applyDemographicFilters(
        dashboard.annotations.baseAggregatedAnnotations,
        dashboard.demographics.demographicSelections
      );
      dashboard.annotations.setAggregatedAnnotations(withDemographicFilters);
      dashboard.annotations.setActiveAnnotation(
        getVisibleAnnotationIndex(withDemographicFilters, dashboard.annotations.activeAnnotation)
      );
    }
  }, [
    dashboard.annotations.baseAggregatedAnnotations,
    dashboard.demographics.demographicSelections,
    dashboard.annotations.setAggregatedAnnotations,
    dashboard.annotations.setActiveAnnotation,
    dashboard.annotations.activeAnnotation,
  ]);

  // Debug: Log when activeAnnotation changes
  // useEffect(() => {
  //   if (dashboard.annotations.activeAnnotation !== -1) {
  //     const activeAnnotations = dashboard.annotations.aggregatedAnnotations[dashboard.annotations.activeAnnotation];
  //     console.log('Active annotation changed:', {
  //       activeAnnotation: dashboard.annotations.activeAnnotation,
  //       annotationsCount: activeAnnotations?.length || 0,
  //       firstAnnotation: activeAnnotations?.[0],
  //       imagePath: activeAnnotations?.[0]?.imagePath,
  //       width: activeAnnotations?.[0]?.width,
  //       height: activeAnnotations?.[0]?.height,
  //     });
  //   }
  // }, [dashboard.annotations.activeAnnotation, dashboard.annotations.aggregatedAnnotations]);

  // Update filter counts when active selection changes
  useEffect(() => {
    dashboard.feedbackFilters.updateFilterCounts(
      dashboard.annotations.aggregatedAnnotations,
      dashboard.annotations.activeAnnotation
    );
  }, [
    activeSelection,
    dashboard.annotations.aggregatedAnnotations,
    dashboard.annotations.activeAnnotation,
    dashboard.feedbackFilters.updateFilterCounts,
  ]);

  const handleSelectionCreated = (selection: Selection) => {
    handleSelectionChange(selection);
    if (dashboard.annotations.activeAnnotation !== -1) {
      const containedSelections = getContainedSelections(
        selection,
        dashboard.annotations.aggregatedAnnotations[dashboard.annotations.activeAnnotation].flatMap(a => a.selections)
      );
      const updatedFilters = dashboard.feedbackFilters.feedbackFilters.map(filterGroup => ({
        ...filterGroup,
        groupCount: containedSelections.length
      }));
      dashboard.feedbackFilters.setFeedbackFilters(updatedFilters);
    }
  };

  const handleSelectionCleared = () => {
    handleSelectionChange(null);
    if (dashboard.annotations.activeAnnotation !== -1) {
      const allSelections = dashboard.annotations.aggregatedAnnotations[dashboard.annotations.activeAnnotation].flatMap(a => a.selections);
      const updatedFilters = dashboard.feedbackFilters.feedbackFilters.map(filterGroup => ({
        ...filterGroup,
        groupCount: allSelections.length
      }));
      dashboard.feedbackFilters.setFeedbackFilters(updatedFilters);
    }
  };

  // Calculate filtered comments
  const currentAnnotationComments =
    dashboard.annotations.activeAnnotation === -1
      ? dashboard.annotations.aggregatedAnnotations.flat().flatMap(annotation => annotation.selections)
      : dashboard.annotations.aggregatedAnnotations[dashboard.annotations.activeAnnotation]
        ?.flatMap(annotation => annotation.selections) ?? [];

  return (
    <>
      <Header />
      <Dialogs />

      <ResizablePanelGroup
        direction='horizontal'
        className="h-[100vh] w-[100%]"
      >
        {showSidebar && (
          <ResizablePanel minSize={30} className="border">
            <Sidebar
              showThumbnailHeatmap={showThumbnailHeatmap}
              onToggleHeatmap={() => setShowThumbnailHeatmap(!showThumbnailHeatmap)}
            />
          </ResizablePanel>
        )}
        <ResizableHandle withHandle />
        <ResizablePanel minSize={40} className="border border-l-0 bg-red-200">
          <div className="main-container h-[92.5vh] w-[100%] p-5 gap-y-2 overflow-scroll">
            <AnnotationView
              selectedViewMode={selectedViewMode}
              onViewModeChange={setSelectedViewMode}
              activeComment={activeComment}
              activeSelection={activeSelection}
              onSelectionCreated={handleSelectionCreated}
              onSelectionCleared={handleSelectionCleared}
              onToggleSidebar={() => setShowSidebar(!showSidebar)}
              onToggleExecutiveSummary={() => setShowExecutiveSummary(!showExecutiveSummary)}
            />

            {showExecutiveSummary && (
              <ExecutiveSummary
                currentCommentsCount={currentAnnotationComments.length}
              />
            )}

            <FeedbackComments
              activeComment={activeComment}
              activeSelection={activeSelection}
              onCommentClick={setActiveComment}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}

function App() {
  const [activeSelection, setActiveSelection] = useState<Selection | null>(null);

  return (
    <DashboardProvider activeSelection={activeSelection}>
      <AppContent onActiveSelectionChange={setActiveSelection} />
    </DashboardProvider>
  );
}

export default App;

