import { useEffect, useState } from 'react'
import './App.css'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable'
import { Annotation, AnnotationsDto, Selection, SelectionDto } from './types/global'
import { generateCoCreateData } from './utils/data-generator'
import { cn } from './lib/utils'
import Ping from './components/ping/Ping'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import Canvas from './components/canvas/Canvas'
import Header from './components/layout/Header'
import { CheckboxWithText } from './components/ui/checkbox'
import { MultiSelect } from './components/ui/multi-select'
import Papa from 'papaparse'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import SelectionThumbnail from './components/selection-thumbnail/SelectionThumbnail'
import { getContainedSelections, isSelectionContained } from './utils/selection-utils'

interface MultiSelectType {
  value: string;
  label: string;
}

interface FeedbackFilterGroup {
  group: string;
  groupType: 'value' | 'field';
  groupCount: number | undefined;
  filters: FeedbackFilter[];
}

interface FeedbackFilter {
  label: string;
  id: string;
  value: string;
  fieldName: string;
  active: boolean;
}

function App() {
  // const generateNumber = () => Math.floor(Math.random() * 1000)
  const [showSidebar, setShowSidebar] = useState<boolean>(true)
  const [showExecutiveSummary, setShowExecutiveSummary] = useState<boolean>(true)
  const [showThumbnailHeatmap, setShowThumbnailHeatmap] = useState<boolean>(true)

  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [aggregatedAnnotations, setAggregatedAnnotations] = useState<Annotation[][]>([])
  const [activeAnnotation, setActiveAnnotation] = useState<number>(-1)
  const [activeComment, setActiveComment] = useState<string | null>(null)
  const [activeSelection, setActiveSelection] = useState<Selection | null>(null)

  const [rolesList, setRolesList] = useState<MultiSelectType[]>([
    { value: "architect", label: "Architect" },
    { value: "designer", label: "Designer" },
    { value: "developer", label: "Developer" },
  ])
  const [tenureList, setTenureList] = useState<MultiSelectType[]>([
    { value: "junior", label: "Junior" },
    { value: "mid-level", label: "Mid-Level" },
    { value: "senior", label: "Senior" },
  ])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedTenures, setSelectedTenures] = useState<string[]>([])
  const [selectedViewMode, setSelectedViewMode] = useState<"selection" | "heatmap" | "flatHeatmap">("flatHeatmap") // "flatHeatmap" | "heatmap" | "selection"

  const [feedbackFilters, setFeedbackFilters] = useState<FeedbackFilterGroup[]>([
    {
      group: "Sentiment",
      groupCount: annotations[activeAnnotation]?.selections.find(selection => selection.aestheticValue)?.aestheticValue?.length ?? 0,
      groupType: "value",
      filters: [
        { label: "Positive", id: "positive", value: "good", fieldName: 'functionValue', active: true },
        { label: "Negative", id: "negative", value: "bad", fieldName: 'functionValue', active: true },
      ]
    },
    {
      group: "Category",
      groupCount: annotations[activeAnnotation]?.selections.find(selection => selection.functionValue)?.functionValue?.length ?? 0,
      groupType: "field",
      filters: [
        { label: "Aesthetic", id: "aesthetic", value: "aesthetic", fieldName: 'aestheticValue', active: true },
        { label: "Functional", id: "functional", value: "functional", fieldName: 'functionValue', active: true },
      ]
    }
  ])

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // function formatBase64Image(image: string) {
  //   return image.startsWith("data:image") ? image : `data:image/png;base64,${image}`;
  // }

  const checkSelectionShowEligibility = (
    selection: Selection,
    feedbackFilters: FeedbackFilterGroup[]
  ) => {
    // First check if the selection is contained within the active selection
    if (activeSelection && !isSelectionContained(activeSelection, selection)) {
      return false;
    }

    const fieldFilters = feedbackFilters.filter(fg => fg.groupType === 'field').flatMap(fg => fg.filters)
    const valueFilters = feedbackFilters.filter(fg => fg.groupType === 'value').flatMap(fg => fg.filters)
    if (!fieldFilters || !valueFilters) return false

    var showElgibility = false
    for (const field of fieldFilters) {
      for (const value of valueFilters) {
        let fieldName = field.fieldName as keyof Selection
        let hasEligibility = selection[fieldName] === value.value && value.active
        if (hasEligibility) return true
      }
    }

    return showElgibility
  }

  const handleFilterChange = (
    questionId: number,
    filterGroup: string,
    fieldName: string,
    value: string
  ) => {

    const filterGroupChanged = feedbackFilters.find(fg => fg.group === filterGroup)
    if (!filterGroupChanged) return

    const filterChanged = filterGroupChanged.filters.find(f => f.fieldName === fieldName && f.value === value)
    if (!filterChanged) return

     // Update checked status
     const updatedFilters = feedbackFilters.map((filterGroup) => {
      const updatedFilters = filterGroup.filters.map((filter) => {
        if (filter.fieldName === fieldName && filter.value === value) {
          return { ...filter, active: !filter.active }
        }
        return filter
      })
      return { ...filterGroup, filters: updatedFilters }
    })

    // Update show status
    const updatedAggregatedAnnotations = aggregatedAnnotations.map((question) => {
      const updatedQuestions = question.map((annotation) => {
        if (annotation.questionId !== questionId) return annotation
        const updatedSelections = annotation.selections.map((selection) =>
          ({ ...selection, show: checkSelectionShowEligibility(selection, updatedFilters) }))
        return { ...annotation, selections: updatedSelections }
      })
      return updatedQuestions
    })

    setFeedbackFilters(updatedFilters)
    setAggregatedAnnotations(updatedAggregatedAnnotations)
  }


  function convertFromBase64(base64: string) {
    return `data:image/png;base64,${base64}`
  }

  function importAnnotations() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) parseCsvFileData(file)
    };
    input.click();
}

  const parseCsvFileData = (csvFile: File) => {

    Papa.parse(csvFile, {
      header: true,
      complete: function(results: any) {
        console.log(results)
        let annotationsDto: AnnotationsDto[] = results.data
        let annotations: Annotation[] = []

        for (let i = 0; i < annotationsDto.length; i++) {
          let selectionData = JSON.parse(annotationsDto[i].selectionsData)
          let imageName = "Mosque"
          let questionId = annotationsDto[i].questionId.replace("QID", "")
          let imagePath = annotationsDto[i].image

          annotations.push({
            imageName: imageName,
            questionId: parseInt(questionId),
            selections: selectionData.map((selection: SelectionDto) => {
              return {
                uid: Math.random().toString(36).substring(7),
                start: selection.start,
                end: selection.end,
                functionValue: selection.functionValue as 'good' | 'bad' | null,
                aestheticValue: selection.aestheticValue as 'good' | 'bad' | null,
                comment: selection.comment,
                show: true
              }
            }),
            image: "",
            imagePath: imagePath,
            scaleFactor: 1,
        })
        }
        console.log(annotations)
        setAnnotations(annotations)
      }})

       // Create 10 buckets, and assign each annotation to a bucket based on questionId
      const buckets: Annotation[][] = Array.from({ length: 1 }, () => [])
      annotations.forEach(annotation => {
        annotation.selections.forEach(selection => {
          selection.show = checkForIniitalShowEligibility(selection)
          selection.uid = Math.random().toString(36).substring(7)
      })
      annotation.show = true
      buckets[annotation.questionId - 1].push(annotation)
    })
    // console.log(buckets)
    setAggregatedAnnotations(buckets)
    }

  const currentAnnotationComments =
    activeAnnotation === -1
      ? aggregatedAnnotations.flat().flatMap(annotation => annotation.selections)
      : aggregatedAnnotations[activeAnnotation]
        ?.flatMap(annotation => annotation.selections) ?? []

  const generateRandomData = () => {
    const numQuestions = 10
    const maxAnnotation = 200
    const minSelectionPerAnnotation = 5
    const maxSelectionPerAnnotation = 400
    const imageSize: [number, number] = [410, 270]
    const pictureRange = 4

    const generatedData = generateCoCreateData(
      numQuestions,
      maxAnnotation,
      minSelectionPerAnnotation,
      maxSelectionPerAnnotation,
      imageSize,
      pictureRange
    );
    setAnnotations(generatedData)

    // Create 10 buckets, and assign each annotation to a bucket based on questionId
    const buckets: Annotation[][] = Array.from({ length: numQuestions }, () => [])
    generatedData.forEach(annotation => {
      annotation.selections.forEach(selection => {
        selection.show = checkForIniitalShowEligibility(selection)
        selection.uid = Math.random().toString(36).substring(7)
      })
      annotation.show = true
      buckets[annotation.questionId].push(annotation)
    })
    // console.log(buckets)
    setAggregatedAnnotations(buckets)
  }

  useEffect(() => generateRandomData(), [])

  const handleSelection = (index: number) => () => {
    const selectionIndex = activeAnnotation === index ? -1 : index
    setActiveAnnotation(selectionIndex)
  }

  const checkForIniitalShowEligibility = (selection: Selection) => {
    return (
      selection.aestheticValue !== null
      || selection.functionValue !== null
    )
  }

  const extractSelectionFieldValue = (value: string | null) => {
    switch (value) {
      case 'good': return '👍'
      case 'bad': return '👎'
      default: return 'N/A'
    }
  }

  /**
   * Handle case insensitive search for annotations, and update the show status of the selections.
   * @param searchText - The text to search for.
   */
  const handleSearchAnnotations = (searchText: string) => {
    const cleanedSearchText = searchText.trim().toLowerCase()
    const updatedAggregatedAnnotations = aggregatedAnnotations.map((question) => {
      const updatedQuestions = question.map((annotation) => {
        return { ...annotation, show: annotation.imageName.toLowerCase().includes(cleanedSearchText) }
      })
      return updatedQuestions
    })
    setAggregatedAnnotations(updatedAggregatedAnnotations)
  }


  /**
   * Handle case insensitive search for comments, and update the show status of the selections.
   * @param searchText - The text to search for.
   */
  const handleSearchComments = (searchText: string) => {
    const cleanedSearchText = searchText.trim().toLowerCase()
    const updatedAggregatedAnnotations = aggregatedAnnotations.map((question) => {
      const updatedQuestions = question.map((annotation) => {
        const updatedSelections = annotation.selections.map((selection) =>
          ({ ...selection, show: selection.comment.toLowerCase().includes(cleanedSearchText) }))
        return { ...annotation, selections: updatedSelections }
      })
      return updatedQuestions
    })
    setAggregatedAnnotations(updatedAggregatedAnnotations)
  }

  // Calculate pagination values
  const filteredComments = currentAnnotationComments
    .filter((selection) => selection.comment !== '' && (selection.aestheticValue !== null || selection.functionValue !== null))
    .filter((selection) => selection.show)
    .filter((selection) => {
      // If there's an active selection, only show comments for selections contained within it
      if (activeSelection) {
        return isSelectionContained(activeSelection, selection);
      }
      return true;
    });

  // Calculate feedback counts
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

  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredComments.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
  };

  const handleSelectionCreated = (selection: Selection) => {
    setActiveSelection(selection);
    // Update filters to show only contained selections
    const containedSelections = getContainedSelections(selection, aggregatedAnnotations[activeAnnotation].flatMap(a => a.selections));
    const updatedFilters = feedbackFilters.map(filterGroup => ({
      ...filterGroup,
      groupCount: containedSelections.length
    }));
    setFeedbackFilters(updatedFilters);
  };

  const handleSelectionCleared = () => {
    setActiveSelection(null);
    // Reset filters to show all selections
    const updatedFilters = feedbackFilters.map(filterGroup => ({
      ...filterGroup,
      groupCount: aggregatedAnnotations[activeAnnotation].flatMap(a => a.selections).length
    }));
    setFeedbackFilters(updatedFilters);
  };

  return (
    <>
      {/* Header */}
      <Header />

      {/* Body */}
      <ResizablePanelGroup
        direction='horizontal'
        className="h-[100vh] w-[100%]"
      >
        {
          showSidebar &&
          <ResizablePanel minSize={30} className="border">
            <div className="main-container h-[92.5vh] w-[100%] border border-[#E8E8E8] p-5 gap-y-2 flex flex-col">

              <div className='flex justify-between items-center'>
                <h1 className="text-2xl font-bold">Annotations</h1>
                <div className="flex gap-2">
                  <Button
                    className="bg-black hover:bg-[#333] text-white hover:cursor-pointer"
                    onClick={() => setShowThumbnailHeatmap(!showThumbnailHeatmap)}
                  >
                    {showThumbnailHeatmap ? 'Hide Heatmaps' : 'Show Heatmaps'}
                  </Button>
                  <Button
                    className="bg-black hover:bg-[#333] text-white hover:cursor-pointer"
                    onClick={importAnnotations}
                  >
                    Import
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex justify-between items-center flex-wrap-reverse gap-2 ">
                <div className="flex w-[65%] gap-2">
                  <input
                    type="text" placeholder="Search annotations"
                    className="border p-1 max-w-[80%] w-[100%] bg-white"
                    onChange={(e) => handleSearchAnnotations(e.target.value)}
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
                  {aggregatedAnnotations.filter(annotation => annotation[0]?.show).length === 0 &&
                    <div className="flex text-gray-400 justify-center items-center w-full h-full">
                      No annotations found
                    </div>
                  }

                  {aggregatedAnnotations
                    .filter(annotation => annotation[0]?.show)
                    .map((annotation, questionIndex) =>  {
                    return (
                      <SelectionThumbnail
                        key={questionIndex}
                        annotations={annotation}
                        width={410}
                        height={270}
                        onClick={handleSelection(questionIndex)}
                        isActive={activeAnnotation === questionIndex}
                        showHeatmap={showThumbnailHeatmap}
                      />
                    );
                  })}
                </div>
              </div>

            </div>
          </ResizablePanel>
        }
        <ResizableHandle withHandle />
        <ResizablePanel minSize={40} className="border border-l-0 bg-red-200">
          {/* <ResizablePanelGroup direction="vertical"> */}
            <div
              className="main-container h-[92.5vh] w-[100%] p-5 gap-y-2 overflow-scroll"
            >

            {/* Annotation */}
            {activeAnnotation !== -1 &&
              <Card className="rounded-xl">
                <CardHeader className="rounded-t-xl m-2 flex flex-row justify-between items-center bg-white">
                  <div>
                    Mosque {activeAnnotation + 1} of {aggregatedAnnotations.length}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      disabled={activeSelection === null}
                      className="bg-black hover:bg-[#333] text-white p-2 cursor-pointer text-sm"
                      onClick={handleSelectionCleared}
                    >
                      Clear Selection
                    </Button>
                    <Button
                      className="bg-black hover:bg-[#333] text-white p-2 cursor-pointer text-sm"
                      onClick={() => setShowExecutiveSummary(!showExecutiveSummary)}
                    >
                      {showExecutiveSummary ? 'Hide Executive Summary' : 'Show Executive Summary'}
                    </Button>
                    <Button
                      className="bg-black hover:bg-[#333] text-white p-2 cursor-pointer text-sm"
                      onClick={() => setShowSidebar(!showSidebar)}
                    >
                      {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 h-[90%]">

                  {/* Data */}
                  <p className='text-warp text-sm'>
                    Question ID: {JSON.stringify(aggregatedAnnotations[activeAnnotation][0]?.questionId)}
                  </p>

                  <div className="flex flex-col lg:flex-row">
                    {/* Canvas */}
                    <div className="flex justify-center items-center w-[100%] lg:w-[80%]">
                      {/* <div className="flex flex-col items-center"> */}
                        <Canvas
                          annotations={aggregatedAnnotations[activeAnnotation]}
                          activeComment={activeComment}
                          canvasWidth={410}
                          canvasHeight={270}
                          viewMode={selectedViewMode}
                          onSelectionCreated={handleSelectionCreated}
                          onSelectionCleared={handleSelectionCleared}
                          onClearSelection={handleSelectionCleared}
                        />
                      {/* </div> */}
                    </div>

                    {/* Search & Filters */}
                    <div className="min-w-[200px] w-[100%] lg:w-[30%] flex flex-row lg:flex-col lg:items-center gap-2 flex-wrap">

                      {/* Selector for view mode */}
                      <div className="w-[100%]">
                        <Select
                          onValueChange={(value) => setSelectedViewMode(value as "selection" | "heatmap" | "flatHeatmap")}
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
                          {
                            feedbackFilters.map((filterGroup, index) => (
                              <>
                                <div key={index} className="w-[100%] flex justify-between">
                                  <span className="text-xs font-medium">{filterGroup.group}</span>
                                  <span className="text-xs font-medium">Total: {filterGroup.groupCount}</span>
                                </div>
                                <div className="flex flex-col gap-1 my-2">
                                  {
                                    filterGroup.filters.map((filter, index) => (
                                      <div key={index} className="flex justify-between items-center">
                                        <CheckboxWithText
                                          id={filter.id}
                                          label={filter.label}
                                          checked={filter.active}
                                          onCheckedChange={() => handleFilterChange(
                                            aggregatedAnnotations[activeAnnotation][0]?.questionId,
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
                                    ))
                                  }
                                </div>
                              </>
                            ))
                          }
                        </CardContent>
                      </Card>

                      <Card className="w-[100%]">
                        <CardHeader className="m-2 p-3 border-1 rounded-lg bg-[#f3f3f3]">
                          <b className="text-xs">User Demographics</b>
                        </CardHeader>
                        <CardContent className="px-3 w-[100%]">
                          <div className="w-[100%] flex justify-between">
                            <span className="text-xs font-medium">Role</span>
                          </div>
                          <div className="flex flex-col gap-1 my-2">
                            <MultiSelect
                              // className='dark:bg-[#202020] dark:border-[#1b1b1b]'
                              options={rolesList}
                              onValueChange={setSelectedRoles}
                              defaultValue={selectedRoles}
                              className="bg-[#f3f3f3]"
                              placeholder="Select Roles"
                              maxCount={3}
                            />
                          </div>
                          <div className="w-[100%] flex justify-between">
                            <span className="text-xs font-medium">Tenure</span>
                          </div>
                          <div className="flex flex-col gap-1 my-2">
                            <MultiSelect
                              // className='dark:bg-[#202020] dark:border-[#1b1b1b]'
                              options={tenureList}
                              onValueChange={setSelectedTenures}
                              defaultValue={selectedTenures}
                              className="bg-[#f3f3f3]"
                              placeholder="Select Tenures"
                              maxCount={3}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }

            {/* Executive Summary */}
            {
              showExecutiveSummary &&
              <Card className="rounded-xl">
                <CardHeader className="rounded-t-xl m-2 border-b-2 border-gray-600 pb-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Executive Summary</CardTitle>
                      <CardDescription>View {activeAnnotation + 1}</CardDescription>
                    </div>
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
                          {currentAnnotationComments.length} Comments
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    <div>
                      <h2>Key Findings</h2>
                      <p className='text-gray-600 text-sm'>
                        Overall positive sentiment (65%) with strong appreciation for modern design elements.
                        Primary concerns center around functional aspects in the upper floor layout.
                      </p>
                    </div>
                    <div className="border-t border-gray-600 my-3"></div>
                    <div>
                      <h2>Critical Analysis</h2>
                      <ul className='list-inside list-disc text-gray-600 text-sm'>
                        <li>Strong consensus on exterior design elements, particularly in the facade treament</li>
                        <li>Mixed feedback on spatial flow, suggesting need for layout optimization</li>
                        <li>Consistent feedback across different stakeholder groups on sustainability features</li>
                      </ul>
                    </div>

                </CardContent>

                <CardFooter>
                  <div className='flex flex-col gap-2 w-[100%]'>
                    <div className='flex gap-2 flex-wrap md:flex-nowrap'>

                      <div className='bg-[#F4FDF7] text-[#85A389] flex flex-col md:w-1/2 p-2'>
                        <b>Strengths</b>
                        <span className='text-sm'>
                          Modern aesthetic, sustainable materials, natural lighting
                        </span>
                      </div>

                      <div className='bg-[#FEF5F5] text-[#CB7D7A] flex flex-col md:w-1/2 p-2'>
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
            }

            {/* Feedback Comments */}
            {
              <Card>
                <CardHeader className='flex flex-row rounded-t-xl m-2 justify-between items-baseline mb-2 pb-3 border-b-2 bg-white'>
                  <CardTitle>Feedback Comments</CardTitle>
                  <CardDescription className="text-gray-400">
                    Total Comments: {currentAnnotationComments.length}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Comment Searchbar */}
                  <div className="flex justify-between items-center my-2">
                    <input
                      type="text"
                      placeholder="Search comments"
                      className="border p-1 w-[80%] bg-white"
                      onChange={(e) => handleSearchComments(e.target.value)}
                    />
                    <Button className="bg-black hover:bg-[#333] border-2 text-white p-1 py-0 my-0 hover:cursor-pointer">
                      Search
                    </Button>
                  </div>

                  <div className="flex flex-col">
                    {/* Flat map on selections */}
                    {currentItems.map((selection, index) =>
                        {
                          const aestheticValue = extractSelectionFieldValue(selection.aestheticValue)
                          const functionValue = extractSelectionFieldValue(selection.functionValue)
                          return (
                          <div key={index} className="flex flex-col gap-2">
                            <Button
                              size='lg'
                              className={cn(
                                "flex flex-row justify-start w-[100%] py-2 my-1",
                                "hover:bg-[#e7e7e7] hover:cursor-pointer",
                                // odd bg color
                                { "bg-[#F2F2F2]": index % 2 === 0 },
                                // even bg color
                                { "bg-[#FAFAFA]": index % 2 !== 0 },
                                { "border-2 border-blue-500": activeComment === selection.uid }
                              )}
                              style={{
                                borderColor: activeComment === selection.uid ? '#1338BE' : '#E8E8E8',
                              }}
                              onClick={() => setActiveComment(selection.uid)}
                            >
                              <div className='flex w-[100%] justify-between gap-2'>
                                <div className='w-[80%]'>
                                  <div className="flex justify-start gap-2 ">
                                    <span>Architect</span> |
                                    <span>{functionValue} <b>Functional</b></span> |
                                    <span>{aestheticValue} <b>Aesthetic</b></span>
                                  </div>
                                  <div className="flex justify-start text-sm text-gray-400 break-words">
                                    {selection.comment.slice(0, 40)}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-400 w-[20%]">
                                  4 days ago
                                </div>
                              </div>
                            </Button>
                          </div>
                      )})}
                  </div>

                  {/* Pagination Controls */}
                  {/* {filteredComments.length > 0 && ( */}
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                          Showing {currentItems.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredComments.length)} of {filteredComments.length} comments
                        </div>

                      </div>
                      <div className="flex items-center gap-1">
                        {/* Previous page arrow */}
                        <Button
                          key="prev"
                          variant={currentPage === 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={
                            cn(
                              currentPage === 1 ? "bg-black text-white" : "",
                              "hover:bg-black hover:text-white"
                            )
                          }
                        >
                          ←
                        </Button>

                        {/* Always show first page */}
                        <Button
                          key="first"
                          variant={currentPage === 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          className={
                            cn(
                              currentPage === 1 ? "bg-black text-white" : "",
                              "hover:bg-black hover:text-white"
                            )
                          }
                        >
                          1
                        </Button>

                        {/* Show ellipsis if we're not near the beginning */}
                        {currentPage > 3 && (
                          <span className="px-2">...</span>
                        )}

                        {/* Show pages around current page */}
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          // Only show pages that are within 2 of the current page
                          if (pageNum > 1 && pageNum < totalPages &&
                              pageNum >= currentPage - 2 &&
                              pageNum <= currentPage + 2) {
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className={
                                  cn(
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

                        {/* Show ellipsis if we're not near the end */}
                        {currentPage < totalPages - 2 && (
                          <span className="px-2">...</span>
                        )}

                        {/* Always show last page if there's more than one page */}
                        {totalPages > 1 && (
                          <Button
                            key="last"
                            variant={currentPage === totalPages ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                            className={
                              cn(
                                currentPage === totalPages ? "bg-black text-white" : "",
                                "hover:bg-black hover:text-white"
                              )
                            }
                          >
                            {totalPages}
                          </Button>
                        )}

                        {/* Next page arrow */}
                        <Button
                          key="next"
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={
                            cn(
                              currentPage === totalPages ? "bg-black text-white" : "",
                              "hover:bg-black hover:text-white"
                            )
                          }
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
                              <SelectValue placeholder={itemsPerPage} />
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
                  {/* )} */}
                </CardContent>
              </Card>
            }
            </div>
          {/* </ResizablePanelGroup> */}
        </ResizablePanel>
    </ResizablePanelGroup>
    </>
  )
}

export default App
