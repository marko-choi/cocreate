import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import Ping from '../ping/Ping';
import { useDashboardContext } from '../../contexts/DashboardContext';

interface ExecutiveSummaryProps {
  currentCommentsCount: number;
}

export const ExecutiveSummary = ({
  currentCommentsCount,
}: ExecutiveSummaryProps) => {
  const dashboard = useDashboardContext();
  const executiveSummary = dashboard.executiveSummary.getCurrentExecutiveSummary();
  return (
    <Card className="rounded-xl">
      <CardHeader className="rounded-t-xl m-2 border-b-2 border-gray-600 pb-3 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Executive Summary</CardTitle>
            <CardDescription>View {dashboard.annotations.activeAnnotation + 1}</CardDescription>
          </div>
          <div className='flex gap-2 flex-col md:flex-row items-start md:items-center'>
            <div className='flex gap-2 flex-col md:flex-row'>
              <div className='flex items-center gap-2'>
                <Ping />
                <span className="text-sm">65% Positive</span>
              </div>
              <div className='flex items-center gap-2'>
                <Ping />
                <span className="text-sm">82% Response Rate</span>
              </div>
              <div className='flex items-center gap-2'>
                <Ping />
                <span className="text-sm">
                  {currentCommentsCount} Comments
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-white"
                onClick={() => {
                  dashboard.executiveSummary.setExecSummaryImportError(null);
                  dashboard.executiveSummary.setExecSummaryImportOpen(true);
                  setTimeout(() => dashboard.executiveSummary.execSummaryTextareaRef.current?.focus(), 0);
                }}
              >
                Import JSON
              </Button>
              <Button
                variant="outline"
                className="bg-white"
                onClick={dashboard.executiveSummary.clearExecutiveSummaryForCurrent}
                disabled={dashboard.annotations.activeAnnotation === -1 || !executiveSummary}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {executiveSummary && (
          <>
            <div>
              <h2>Key Findings</h2>
              <p className='text-gray-600 text-sm'>
                {executiveSummary.summary}
              </p>
            </div>
            <div className="border-t border-gray-600 my-3"></div>
            <div>
              <h2>Critical Analysis</h2>
              <ul className='list-inside list-disc text-gray-600 text-sm'>
                {executiveSummary.analysis.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter>
        {executiveSummary && (
          <div className='flex flex-col gap-2 w-[100%]'>
            <div className='flex gap-2 flex-wrap md:flex-nowrap'>
              <div className='bg-[#F4FDF7] text-[#85A389] flex flex-col md:w-1/2 p-2'>
                <b>Strengths</b>
                <span className='text-sm'>
                  {executiveSummary.strengths}
                </span>
              </div>

              <div className='bg-[#FEF5F5] text-[#CB7D7A] flex flex-col md:w-1/2 p-2'>
                <b>Area of Improvements</b>
                <span className='text-sm'>
                  {executiveSummary.improvements}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
