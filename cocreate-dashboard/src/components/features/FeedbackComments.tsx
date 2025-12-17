import { useState, useEffect, useMemo } from 'react';
import { Selection, Annotation } from '../../types/global';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '../../lib/utils';
import { useDashboardContext } from '../../contexts/DashboardContext';
import { isSelectionContained } from '../../utils/selection-utils';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackCommentsProps {
  activeComment: string | null;
  activeSelection: Selection | null;
  onCommentClick: (uid: string) => void;
}

interface SelectionWithAnnotation {
  selection: Selection;
  annotation: Annotation;
}

export const FeedbackComments = ({
  activeComment,
  activeSelection,
  onCommentClick,
}: FeedbackCommentsProps) => {
  const dashboard = useDashboardContext();

  // Calculate filtered comments with their parent annotations
  const selectionsWithAnnotations = useMemo(() => {
    const annotations = dashboard.annotations.activeAnnotation === -1
      ? dashboard.annotations.aggregatedAnnotations.flat()
      : dashboard.annotations.aggregatedAnnotations[dashboard.annotations.activeAnnotation] ?? [];

    const result: SelectionWithAnnotation[] = [];
    annotations.forEach((annotation) => {
      annotation.selections.forEach((selection) => {
        if (selection.show !== false) {
          if (!activeSelection || isSelectionContained(activeSelection, selection)) {
            result.push({ selection, annotation });
          }
        }
      });
    });
    return result;
  }, [
    dashboard.annotations.aggregatedAnnotations,
    dashboard.annotations.activeAnnotation,
    activeSelection,
  ]);

  const filteredComments = selectionsWithAnnotations;

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredComments.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
  };

  return (
    <Card>
      <CardHeader className='flex flex-row rounded-t-xl m-2 justify-between items-baseline mb-2 pb-3 border-b-2 bg-white'>
        <CardTitle>Feedback Comments</CardTitle>
        <CardDescription className="text-gray-400">
          Total Comments: {filteredComments.length}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Comment Searchbar */}
        <div className="flex justify-between items-center my-2">
          <input
            type="text"
            placeholder="Search comments"
            className="border p-1 w-[80%] bg-white"
            onChange={(e) => dashboard.search.handleSearchComments(e.target.value)}
          />
          <Button className="bg-black hover:bg-[#333] border-2 text-white p-1 py-0 my-0 hover:cursor-pointer">
            Search
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          {currentItems.map(({ selection, annotation }, index) => {
            const commentNumber = indexOfFirstItem + index + 1;

            // Helper function to render value with icon or dash
            const renderValueWithIcon = (value: 'good' | 'bad' | null) => {
              if (value === 'good') {
                return <ThumbsUp className="w-4 h-4 text-green-600" />;
              } else if (value === 'bad') {
                return <ThumbsDown className="w-4 h-4 text-red-600" />;
              }
              return <span>-</span>;
            };

            // Get demographic columns that are selected for display
            const demographicFilters = dashboard.demographics.demographicFilters;

            return (
              <Button
                key={selection.uid}
                size='lg'
                className={cn(
                  "flex flex-col items-start w-[100%] py-1.5 px-3 min-h-fit",
                  "hover:bg-[#e7e7e7] hover:cursor-pointer",
                  { "bg-[#F2F2F2]": index % 2 === 0 },
                  { "bg-[#FAFAFA]": index % 2 !== 0 },
                  { "border-2 border-blue-500": activeComment === selection.uid }
                )}
                style={{
                  borderColor: activeComment === selection.uid ? '#1338BE' : '#E8E8E8',
                }}
                onClick={() => onCommentClick(selection.uid)}
              >
                <div className='flex w-[100%] flex-col'>
                  {/* Header Row with Comment Number and Timestamp */}
                  <div className='flex w-[100%] justify-between items-start mb-0.5'>
                    <div className="font-semibold text-left" style={{ lineHeight: 1.1 }}>
                      Comment {commentNumber}
                    </div>
                    <div className="text-sm text-gray-400 whitespace-nowrap ml-4" style={{ lineHeight: 1.1 }}>
                      4 days ago
                    </div>
                  </div>

                  {/* Row 1: User Demographics - flex wrap for overflow */}
                  <div className='flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-left mb-0.5' style={{ lineHeight: 1.1 }}>
                    {demographicFilters.map((filter) => {
                      const demographicValue = annotation.demographics?.[filter.key];
                      if (demographicValue) {
                        return (
                          <span key={filter.key} className="whitespace-nowrap">
                            <span className="font-medium">{filter.label}</span>: <span className="text-gray-600">{demographicValue}</span>
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Row 2: Annotation Data (Functional, Aesthetic) */}
                  <div className='flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-left mb-0.5' style={{ lineHeight: 1.1 }}>
                    <span className="flex items-center gap-1">
                      Functional: {renderValueWithIcon(selection.functionValue)}
                    </span>
                    <span className="flex items-center gap-1">
                      Aesthetic: {renderValueWithIcon(selection.aestheticValue)}
                    </span>
                  </div>

                  {/* Comment Text */}
                  <div className='flex-1 min-w-0 text-left' style={{ lineHeight: 1.1 }}>
                    <div className="text-sm text-gray-400 break-words text-left" style={{ lineHeight: 1.1 }}>
                      {selection.comment}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Showing {currentItems.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredComments.length)} of {filteredComments.length} comments
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              key="prev"
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                currentPage === 1 ? "bg-black text-white" : "",
                "hover:bg-black hover:text-white"
              )}
            >
              ←
            </Button>

            <Button
              key="first"
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(1)}
              className={cn(
                currentPage === 1 ? "bg-black text-white" : "",
                "hover:bg-black hover:text-white"
              )}
            >
              1
            </Button>

            {currentPage > 3 && (
              <span className="px-2">...</span>
            )}

            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (pageNum > 1 && pageNum < totalPages &&
                  pageNum >= currentPage - 2 &&
                  pageNum <= currentPage + 2) {
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      currentPage === pageNum ? "bg-black text-white" : "",
                      "hover:bg-black hover:text-white"
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              }
              return null;
            })}

            {currentPage < totalPages - 2 && (
              <span className="px-2">...</span>
            )}

            {totalPages > 1 && (
              <Button
                key="last"
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                className={cn(
                  currentPage === totalPages ? "bg-black text-white" : "",
                  "hover:bg-black hover:text-white"
                )}
              >
                {totalPages}
              </Button>
            )}

            <Button
              key="next"
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                currentPage === totalPages ? "bg-black text-white" : "",
                "hover:bg-black hover:text-white"
              )}
            >
              →
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Records per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={itemsPerPage.toString()} />
              </SelectTrigger>
              <SelectContent className="bg-[#F9FAFB]">
                <SelectItem className="hover:bg-[#F3F3F3] hover:cursor-pointer" value="5">5</SelectItem>
                <SelectItem className="hover:bg-[#F3F3F3] hover:cursor-pointer" value="10">10</SelectItem>
                <SelectItem className="hover:bg-[#F3F3F3] hover:cursor-pointer" value="20">20</SelectItem>
                <SelectItem className="hover:bg-[#F3F3F3] hover:cursor-pointer" value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
