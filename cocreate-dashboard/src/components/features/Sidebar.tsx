import { useState } from 'react';
import { Button } from '../ui/button';
import SelectionThumbnail from '../selection-thumbnail/SelectionThumbnail';
import { cn } from '../../lib/utils';
import { useDashboardContext } from '../../contexts/DashboardContext';
import { getVisibleAnnotationIndex } from '../../utils/annotation-utils';

interface SidebarProps {
  showThumbnailHeatmap: boolean;
  onToggleHeatmap: () => void;
}

export const Sidebar = ({
  showThumbnailHeatmap,
  onToggleHeatmap,
}: SidebarProps) => {
  const dashboard = useDashboardContext();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    dashboard.search.handleSearchAnnotations(term);
  };

  const handleAnnotationClick = (index: number) => {
    const selectionIndex = dashboard.annotations.activeAnnotation === index ? -1 : index;
    dashboard.annotations.setActiveAnnotation(selectionIndex);
  };
  return (
    <div className="main-container h-[92.5vh] w-[100%] border border-[#E8E8E8] p-5 gap-y-2 flex flex-col">
      <div className='flex justify-between items-center'>
        <h1 className="text-2xl font-bold">Annotations</h1>
        <div className="flex gap-2">
          <Button
            className="bg-black hover:bg-[#333] text-white hover:cursor-pointer"
            onClick={onToggleHeatmap}
          >
            {showThumbnailHeatmap ? 'Hide Heatmaps' : 'Show Heatmaps'}
          </Button>
          <Button
            className="bg-black hover:bg-[#333] text-white hover:cursor-pointer"
            onClick={dashboard.csvImport.importAnnotations}
          >
            Import
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center flex-wrap-reverse gap-2 ">
        <div className="flex w-[65%] gap-2">
          <input
            type="text"
            placeholder="Search annotations"
            className="border p-1 max-w-[80%] w-[100%] bg-white"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className='mx-auto h-[90vh] overflow-scroll w-[100%]'>
        <div
          className={cn(
            "scrollable-main-container",
            "p-3 flex flex-wrap justify-center gap-5 max-h-[90vh] border overflow-scroll",
            "min-w-[100%]",
            "bg-white"
          )}
        >
          {dashboard.annotations.aggregatedAnnotations.filter(annotation => annotation[0]?.show).length === 0 && (
            <div className="flex text-gray-400 justify-center items-center w-full h-full">
              No annotations found
            </div>
          )}

          {dashboard.annotations.aggregatedAnnotations
            .map((annotation, originalIndex) => {
              if (!annotation || annotation.length === 0 || !annotation[0]?.show) {
                return null;
              }
              return { annotation, originalIndex };
            })
            .filter((item) => item !== null)
            .map(({ annotation, originalIndex }) => (
              <SelectionThumbnail
                key={originalIndex}
                annotations={annotation}
                width={annotation[0]?.width || 410}
                height={annotation[0]?.height || 270}
                onClick={() => handleAnnotationClick(originalIndex)}
                isActive={dashboard.annotations.activeAnnotation === originalIndex}
                showHeatmap={showThumbnailHeatmap}
              />
            ))}
        </div>
      </div>
    </div>
  );
};
