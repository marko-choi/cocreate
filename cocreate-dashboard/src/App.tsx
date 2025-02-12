import { useEffect, useState } from 'react'
import './App.css'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable'
import { Annotation } from './types/global'
import { decodeBase64Image, generateCoCreateData } from './utils/data-generator'
import { cn } from './lib/utils'
import Ping from './components/ping/Ping'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card'
import { Separator } from './components/ui/separator'

function App() {

  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [aggregatedAnnotations, setAggregatedAnnotations] = useState<Annotation[][]>([])
  const [activeAnnotation, setActiveAnnotation] = useState<number>(-1)

  function formatBase64Image(image: string) {
    return image.startsWith("data:image") ? image : `data:image/png;base64,${image}`;
  }

  const currentAnnotationComments = aggregatedAnnotations[activeAnnotation] || []
  

  useEffect(() => {
    const numQuestions = 10
    const maxAnnotation = 10
    const minSelectionPerAnnotation = 1
    const maxSelectionPerAnnotation = 5
    const imageSize: [number, number] = [1000, 1000]
    
    const generatedData = generateCoCreateData(
      numQuestions, 
      maxAnnotation, 
      minSelectionPerAnnotation, 
      maxSelectionPerAnnotation, 
      imageSize
    );
    setAnnotations(generatedData)

    // Create 10 buckets, and assign each annotation to a bucket based on questionId
    const buckets: Annotation[][] = Array.from({ length: numQuestions }, () => [])
    generatedData.forEach(annotation => {
      buckets[annotation.questionId].push(annotation)
    })
    console.log(buckets)
    setAggregatedAnnotations(buckets)
  }, [])

  const handleSelection = (index: number) => () => {
    const selectionIndex = activeAnnotation === index ? -1 : index
    setActiveAnnotation(selectionIndex)
  }

  return (
    <>
      <ResizablePanelGroup 
        direction='horizontal' 
        className="h-[100vh] rounded-lg border"
      >
        <ResizablePanel minSize={30} className="bg-[#202020] border">
          <div className="h-[100vh] w-[100%] border p-5">
            <h1 className="text-2xl font-bold pb-3">Annotations</h1>
            <div className="flex flex-wrap gap-5 w-[100%] h-[90vh] border overflow-scroll">
              {aggregatedAnnotations.map((annotation, index) => (
                <div
                  key={index} 
                  className={cn(
                    "flex jusify-content-center items-center relative cursor-pointer",
                    "hover:scale-105 transform transition duration-300 ease-in-out",
                    "border-3 border-transparent",
                    { "border-blue-500": activeAnnotation === index }
                  )}
                >
                  <img src="../rendering.jpg" 
                    alt="rendering" 
                    className="w-80 top-0 left-0 right-0 bottom-0 m-auto"
                    onClick={handleSelection(index)}
                  />
                  {/* // Create an overlay to show the number of annotations */}
                  <div className="absolute bottom-0 left-0 w-[100%] bg-[#111111cc] text-white p-1 z-30">
                    View {index + 1} - {annotation.length} comments
                    {/* {JSON.stringify(annotation)}   */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        {
          activeAnnotation !== -1 && 
          <ResizablePanel 
            minSize={30}
            className="bg-[#202020] border"
          >
            <div className="p-3">

              <Card className="border-[#444] bg-[#1f1f1f] rounded-xl shadow-2xl">
                <CardHeader className="bg-[#161616] rounded-xl m-2">
                  <div className="flex items-center justify-between ">
                    <div>
                      <CardTitle>Executive Summary</CardTitle>
                      <CardDescription className="text-gray-400">View {activeAnnotation + 1}</CardDescription>
                    </div>
                    <div className='flex gap-2 flex-col md:flex-row'>
                      <div className='flex items-center gap-2'>
                        <Ping />
                        <span className="text-sm text-gray-400">65% Positive</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Ping />
                        <span className="text-sm text-gray-400">82% Response Rate</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Ping />
                        <span className="text-sm text-gray-400">
                          {currentAnnotationComments.length} Comments
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {/* <div className="border-t border-gray-400 mx-3"></div> */}
                <CardContent>

                    <div>
                      <h2>Key Findings</h2>
                      <p className='text-gray-400 text-sm'>
                        Overall positive sentiment (65%) with strong appreciation for modern design elements.
                        Primary concerns center around functional aspects in the upper floor layout.
                      </p>
                    </div>
                    <div className="border-t border-gray-400 my-3"></div>
                    <div>
                      <h2>Critical Analysis</h2>
                      <ul className='list-inside list-disc text-gray-400 text-sm'> 
                        <li>Storng consensus on exterior design elements, particularly in the facade treament</li>
                        <li>Mixed feedback on spatial flow, suggesting need for layout optimization</li>
                        <li>Consistent feedback across different stakeholder groups on sustainability features</li>
                      </ul>
                    </div>

                </CardContent>

                <CardFooter>
                  <div className='flex flex-col gap-2'>
                    <div className='flex gap-2'>
                      <div className='bg-green-600/40 text-green-200 flex flex-col w-1/2 p-2'>
                        <b>Strengths</b>
                        <span className='text-sm'>
                          Modern aesthetic, sustainable materials, natural lighting
                        </span>
                      </div>

                      <div className='bg-red-500/50 text-red-200 flex flex-col w-1/2 p-2'>
                        <b>Area of Improvements</b>
                        <span className='text-sm'>
                          Functional layout, lack of storage, limited natural light
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Last Updated: 2 days ago</span>
                    </div>
                  </div>
                </CardFooter>

              </Card>

            </div>
          </ResizablePanel>
        }
      </ResizablePanelGroup>
        
            {/* {annotation.selections.map((selection, index) => (
                  <div key={index} className="border p-3 w-50 h-50">
                    <div>Start: {selection.start.x}, {selection.start.y}</div>
                    <div>End: {selection.end.x}, {selection.end.y}</div>
                    <div>Function Value: {selection.functionValue}</div>
                    <div>Aesthetic Value: {selection.aestheticValue}</div>
                    <div>Comment: {selection.comment}</div>
                  </div>
                ))} */}
    </>
  )
}

export default App
