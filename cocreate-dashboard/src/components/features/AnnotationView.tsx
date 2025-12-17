import { useState } from 'react';
import { Selection } from '../../types/global';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CheckboxWithText } from '../ui/checkbox';
import { MultiSelect } from '../ui/multi-select';
import Canvas from '../canvas/Canvas';
import { useDashboardContext } from '../../contexts/DashboardContext';
import { isSelectionContained } from '../../utils/selection-utils';

interface AnnotationViewProps {
  selectedViewMode: "selection" | "heatmap" | "flatHeatmap";
  onViewModeChange: (mode: "selection" | "heatmap" | "flatHeatmap") => void;
  activeComment: string | null;
  activeSelection: Selection | null;
  onSelectionCreated: (selection: Selection) => void;
  onSelectionCleared: () => void;
  onToggleSidebar: () => void;
  onToggleExecutiveSummary: () => void;
}

export const AnnotationView = ({
  selectedViewMode,
  onViewModeChange,
  activeComment,
  activeSelection,
  onSelectionCreated,
  onSelectionCleared,
  onToggleSidebar,
  onToggleExecutiveSummary,
}: AnnotationViewProps) => {
  const dashboard = useDashboardContext();

  if (dashboard.annotations.activeAnnotation === -1) return null;

  const currentAnnotations = dashboard.annotations.aggregatedAnnotations[dashboard.annotations.activeAnnotation] || [];
  const questionId = currentAnnotations[0]?.questionId;

  // Calculate filtered comments for counts
  const currentAnnotationComments = currentAnnotations.flatMap(annotation => annotation.selections);
  const filteredComments = currentAnnotationComments
    .filter((selection) => selection.show !== false)
    .filter((selection) => {
      if (!activeSelection) return true;
      return isSelectionContained(activeSelection, selection);
    });

  const positiveCount = filteredComments.filter(selection =>
    selection.aestheticValue === 'good' || selection.functionValue === 'good'
  ).length;

  const negativeCount = filteredComments.filter(selection =>
    selection.aestheticValue === 'bad' || selection.functionValue === 'bad'
  ).length;

  const aestheticCount = filteredComments.filter(selection =>
    selection.aestheticValue !== null
  ).length;

  const functionalCount = filteredComments.filter(selection =>
    selection.functionValue !== null
  ).length;

  return (
    <Card className="rounded-xl">
      <CardHeader className="rounded-t-xl m-2 flex flex-row flex-wrap justify-between items-center gap-2 bg-white">
        <div>
          Question {dashboard.annotations.aggregatedAnnotations.length}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={activeSelection === null}
            className="bg-black hover:bg-[#333] text-white p-2 cursor-pointer text-sm"
            onClick={onSelectionCleared}
          >
            Clear Selection
          </Button>
          <Button
            className="bg-black hover:bg-[#333] text-white p-2 cursor-pointer text-sm"
            onClick={onToggleExecutiveSummary}
          >
            Toggle Executive Summary
          </Button>
          <Button
            className="bg-black hover:bg-[#333] text-white p-2 cursor-pointer text-sm"
            onClick={onToggleSidebar}
          >
            Toggle Sidebar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 h-[90%]">
        <p className='text-warp text-sm'>
          Question ID: {JSON.stringify(questionId)}
        </p>

        <div className="flex flex-col lg:flex-row">
          {/* Canvas */}
          <div className="flex justify-center items-center w-[100%] lg:w-[80%]">
            <Canvas
              annotations={currentAnnotations}
              activeComment={activeComment}
              canvasWidth={currentAnnotations[0]?.width || 723}
              canvasHeight={currentAnnotations[0]?.height || 534}
              viewMode={selectedViewMode}
              onSelectionCreated={onSelectionCreated}
              onSelectionCleared={onSelectionCleared}
              onClearSelection={onSelectionCleared}
            />
          </div>

          {/* Search & Filters */}
          <div className="min-w-[200px] w-[100%] lg:w-[30%] flex flex-row lg:flex-col lg:items-center gap-2 flex-wrap">
            {/* Selector for view mode */}
            <div className="w-[100%]">
              <Select
                onValueChange={(value) => onViewModeChange(value as "selection" | "heatmap" | "flatHeatmap")}
                defaultValue={selectedViewMode}
              >
                <SelectTrigger className="border-2 p-2 cursor-pointer text-sm w-[100%]">
                  <SelectValue placeholder="Select View Mode" />
                </SelectTrigger>
                <SelectContent className="w-[100%] bg-[#F9FAFB]">
                  <SelectItem className="hover:bg-white border-[#EBEAEB] border-t-2 p-2 cursor-pointer text-sm w-[100%]" value="selection">Selection</SelectItem>
                  <SelectItem className="hover:bg-white border-[#EBEAEB] border-t-2 p-2 cursor-pointer text-sm w-[100%]" value="heatmap">Heatmap</SelectItem>
                  <SelectItem className="hover:bg-white border-[#EBEAEB] border-t-2 p-2 cursor-pointer text-sm w-[100%]" value="flatHeatmap">Flat Heatmap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="w-[100%]">
              <CardHeader className="m-2 p-3 border-1 rounded-lg bg-[#f3f3f3]">
                <b className="text-xs">Feedback Properties</b>
              </CardHeader>
              <CardContent className="px-3 w-[100%]">
                {dashboard.feedbackFilters.feedbackFilters.map((filterGroup) => (
                  <div key={filterGroup.group} className="flex flex-col">
                    <div className="w-[100%] flex justify-between">
                      <span className="text-xs font-medium">{filterGroup.group}</span>
                      <span className="text-xs font-medium">Total: {filterGroup.groupCount}</span>
                    </div>
                    <div className="flex flex-col gap-1 my-2">
                      {filterGroup.filters.map((filter) => (
                        <div key={filter.id} className="flex justify-between items-center">
                          <CheckboxWithText
                            id={filter.id}
                            label={filter.label}
                            checked={filter.active}
                            onCheckedChange={() => dashboard.feedbackFilters.handleFilterChange(
                              questionId,
                              filterGroup.group,
                              filter.fieldName,
                              filter.value
                            )}
                          />
                          {filterGroup.group === "Sentiment" && (
                            <span className="text-xs">
                              {filter.value === "good" ? (
                                <span className="text-green-600">{positiveCount}</span>
                              ) : (
                                <span className="text-red-600">{negativeCount}</span>
                              )}
                            </span>
                          )}
                          {filterGroup.group === "Category" && (
                            <span className="text-xs">
                              {filter.value === "aesthetic" ? (
                                <span className="text-blue-600">{aestheticCount}</span>
                              ) : (
                                <span className="text-purple-600">{functionalCount}</span>
                              )}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="w-[100%]">
              <CardHeader className="m-2 p-3 border-1 rounded-lg bg-[#f3f3f3]">
                <b className="text-xs">User Demographics</b>
              </CardHeader>
                        <CardContent className="px-3 w-[100%] flex flex-col gap-3">
                          {dashboard.demographics.demographicFilters.length === 0 && (
                            <span className="text-xs text-gray-500">
                              Import a CSV and choose demographic columns to enable filters.
                            </span>
                          )}
                          {dashboard.demographics.demographicFilters.map((filter) => (
                            <div key={filter.key} className="flex flex-col gap-1 my-1">
                              <div className="w-[100%] flex justify-between">
                                <span className="text-xs font-medium">{filter.label}</span>
                              </div>
                              <MultiSelect
                                key={`${filter.key}-${filter.selectedValues.join('|')}`}
                                options={filter.options}
                                onValueChange={(values) => dashboard.demographics.handleDemographicFilterChange(filter.key, values)}
                                defaultValue={filter.selectedValues}
                                className="bg-[#f3f3f3]"
                                placeholder="Select items"
                                maxCount={5}
                                showSelectedCount
                              />
                            </div>
                          ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
