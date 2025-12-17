import { useEffect, useRef, useState } from 'react'
import './App.css'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable'
import { Annotation, AnnotationsDto, ExecutiveSummaryJson, Selection, SelectionDto } from './types/global'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog'
import { MinusCircle } from 'lucide-react'

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

interface DemographicFilter {
  key: string;
  label: string;
  options: MultiSelectType[];
  selectedValues: string[];
}

const CORE_COLUMNS = [
  "questionId",
  "selectionsData",
  "image",
  "metadata",
  "StartDate",
  "EndDate",
  "Status",
  "Progress",
  "RecordedDate",
  "ResponseId"
]

function App() {
  // const generateNumber = () => Math.floor(Math.random() * 1000)
  const [showSidebar, setShowSidebar] = useState<boolean>(true)
  const [showExecutiveSummary, setShowExecutiveSummary] = useState<boolean>(true)
  const [showThumbnailHeatmap, setShowThumbnailHeatmap] = useState<boolean>(true)

  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [baseAggregatedAnnotations, setBaseAggregatedAnnotations] = useState<Annotation[][]>([])
  const [aggregatedAnnotations, setAggregatedAnnotations] = useState<Annotation[][]>([])
  const [activeAnnotation, setActiveAnnotation] = useState<number>(-1)

  // Debug: Log when activeAnnotation changes
  useEffect(() => {
    if (activeAnnotation !== -1) {
      const activeAnnotations = aggregatedAnnotations[activeAnnotation]
      console.log('Active annotation changed:', {
        activeAnnotation,
        annotationsCount: activeAnnotations?.length || 0,
        firstAnnotation: activeAnnotations?.[0],
        imagePath: activeAnnotations?.[0]?.imagePath,
        width: activeAnnotations?.[0]?.width,
        height: activeAnnotations?.[0]?.height,
      })
    }
  }, [activeAnnotation, aggregatedAnnotations])
  const [activeComment, setActiveComment] = useState<string | null>(null)
  const [activeSelection, setActiveSelection] = useState<Selection | null>(null)

  const [selectedViewMode, setSelectedViewMode] = useState<"selection" | "heatmap" | "flatHeatmap">("flatHeatmap") // "flatHeatmap" | "heatmap" | "selection"

  // Executive Summary import (per view / annotation index)
  const [executiveSummariesByAnnotation, setExecutiveSummariesByAnnotation] = useState<Record<number, ExecutiveSummaryJson | undefined>>({})
  const [execSummaryImportOpen, setExecSummaryImportOpen] = useState<boolean>(false)
  const [execSummaryImportText, setExecSummaryImportText] = useState<string>('')
  const [execSummaryImportError, setExecSummaryImportError] = useState<string | null>(null)
  const execSummaryTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const getCurrentExecutiveSummary = (): ExecutiveSummaryJson | undefined => {
    if (activeAnnotation === -1) return undefined
    return executiveSummariesByAnnotation[activeAnnotation]
  }

  const parseExecutiveSummaryJson = (value: unknown): ExecutiveSummaryJson => {
    if (typeof value !== 'object' || value === null) throw new Error('Invalid JSON: expected an object')
    const v = value as Record<string, unknown>

    const summary = v.summary
    const analysis = v.analysis
    const strengths = v.strengths
    const improvements = v.improvements

    if (typeof summary !== 'string') throw new Error('Invalid JSON: "summary" must be a string')
    if (!Array.isArray(analysis) || !analysis.every((x) => typeof x === 'string')) {
      throw new Error('Invalid JSON: "analysis" must be an array of strings')
    }
    if (typeof strengths !== 'string') throw new Error('Invalid JSON: "strengths" must be a string')
    if (typeof improvements !== 'string') throw new Error('Invalid JSON: "improvements" must be a string')

    return { summary, analysis, strengths, improvements }
  }

  const importExecutiveSummaryFromText = () => {
    setExecSummaryImportError(null)
    if (activeAnnotation === -1) {
      setExecSummaryImportError('No active view selected yet.')
      return
    }

    try {
      const parsed = JSON.parse(execSummaryImportText)
      const validated = parseExecutiveSummaryJson(parsed)
      setExecutiveSummariesByAnnotation((prev) => ({ ...prev, [activeAnnotation]: validated }))
      setExecSummaryImportOpen(false)
      setExecSummaryImportText('')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid JSON'
      setExecSummaryImportError(message)
      // keep dialog open so user can fix
      setTimeout(() => execSummaryTextareaRef.current?.focus(), 0)
    }
  }

  const clearExecutiveSummaryForCurrent = () => {
    setExecSummaryImportError(null)
    if (activeAnnotation === -1) return
    setExecutiveSummariesByAnnotation((prev) => {
      const next = { ...prev }
      delete next[activeAnnotation]
      return next
    })
  }

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

  // Demographic selection flow
  const [demographicModalOpen, setDemographicModalOpen] = useState<boolean>(false)
  const [demographicModalStep, setDemographicModalStep] = useState<'select' | 'rename'>('select')
  const [availableDemographicColumns, setAvailableDemographicColumns] = useState<string[]>([])
  const [pendingDemographicColumns, setPendingDemographicColumns] = useState<string[]>([])
  const [pendingDemographicLabels, setPendingDemographicLabels] = useState<Record<string, string>>({})
  const [demographicSearchTerm, setDemographicSearchTerm] = useState<string>('')
  const [demographicFilters, setDemographicFilters] = useState<DemographicFilter[]>([])
  const [demographicSelections, setDemographicSelections] = useState<Record<string, string[]>>({})

  // CSV cleanup (virtual tabular grid before demographic selection)
  const [csvCleanupOpen, setCsvCleanupOpen] = useState<boolean>(false)
  const [csvCleanupColumns, setCsvCleanupColumns] = useState<string[]>([])
  const [csvCleanupRows, setCsvCleanupRows] = useState<Record<string, unknown>[]>([])

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const findFirstVisibleAnnotationIndex = (data: Annotation[][]) => {
    return data.findIndex(bucket => bucket[0]?.show !== false && bucket.length > 0)
  }

  const getVisibleAnnotationIndex = (data: Annotation[][], preferredIndex: number) => {
    if (preferredIndex !== -1 && data[preferredIndex]?.[0]?.show !== false) return preferredIndex
    const firstVisible = findFirstVisibleAnnotationIndex(data)
    return firstVisible === -1 ? -1 : firstVisible
  }

  const applyDemographicFilters = (
    sourceAnnotations: Annotation[][],
    filters: Record<string, string[]>
  ) => {
    const hasActiveFilters = Object.values(filters).some(values => values && values.length > 0)

    return sourceAnnotations.map((bucket) => {
      let bucketHasMatch = false
      const updatedBucket = bucket.map((annotation) => {
        const matches = !hasActiveFilters || Object.entries(filters).every(([key, values]) => {
          if (!values || values.length === 0) return true
          const demographicValue = annotation.demographics?.[key]
          return demographicValue ? values.includes(String(demographicValue)) : false
        })

        if (matches && annotation.show !== false) bucketHasMatch = true

        const updatedSelections = annotation.selections.map((selection) => {
          const baseShow = selection.show !== false
          return { ...selection, show: baseShow && matches }
        })

        return { ...annotation, selections: updatedSelections, show: (annotation.show !== false) && matches }
      })

      if (!bucketHasMatch && updatedBucket.length > 0) {
        return updatedBucket.map((annotation, index) => index === 0 ? { ...annotation, show: false } : annotation)
      }

      if (bucketHasMatch && updatedBucket.length > 0) {
        return updatedBucket.map((annotation, index) => index === 0 ? { ...annotation, show: true } : annotation)
      }

      return updatedBucket
    })
  }

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

    const sourceAggregatedAnnotations = baseAggregatedAnnotations.length > 0 ? baseAggregatedAnnotations : aggregatedAnnotations
    // Update show status
    const updatedAggregatedAnnotations = sourceAggregatedAnnotations.map((question) => {
      const updatedQuestions = question.map((annotation) => {
        if (annotation.questionId !== questionId) return annotation
        const updatedSelections = annotation.selections.map((selection) =>
          ({ ...selection, show: checkSelectionShowEligibility(selection, updatedFilters) }))
        return { ...annotation, selections: updatedSelections }
      })
      return updatedQuestions
    })

    setFeedbackFilters(updatedFilters)
    setBaseAggregatedAnnotations(updatedAggregatedAnnotations)
    const withDemographicFilters = applyDemographicFilters(updatedAggregatedAnnotations, demographicSelections)
    setAggregatedAnnotations(withDemographicFilters)
    setActiveAnnotation(getVisibleAnnotationIndex(withDemographicFilters, activeAnnotation))
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

  const resetCsvCleanupState = () => {
    setCsvCleanupOpen(false)
    setCsvCleanupColumns([])
    setCsvCleanupRows([])
  }

  const removeCsvColumn = (column: string) => {
    // Prevent removing required columns needed to build annotations.
    if (column === 'selectionsData' || column === 'image') return
    setCsvCleanupColumns((prev) => prev.filter((c) => c !== column))
    setCsvCleanupRows((prev) =>
      prev.map((row) => {
        const next = { ...row }
        delete (next as Record<string, unknown>)[column]
        return next
      })
    )
  }

  const removeCsvRow = (rowIndex: number) => {
    setCsvCleanupRows((prev) => prev.filter((_, idx) => idx !== rowIndex))
  }

  const importFromCsvData = (rows: Record<string, unknown>[], allColumns: string[]) => {
    const demographicColumns = allColumns.filter((column) => !CORE_COLUMNS.includes(column))
    setAvailableDemographicColumns(demographicColumns)
    setPendingDemographicColumns([])
    setPendingDemographicLabels(Object.fromEntries(demographicColumns.map((column) => [column, column])))
    setDemographicModalStep('select')
    setDemographicFilters([])
    setDemographicSelections({})

    const annotationsDto: AnnotationsDto[] = rows as unknown as AnnotationsDto[]
    const annotations: Annotation[] = []

    for (let i = 0; i < annotationsDto.length; i++) {
      const row = annotationsDto[i]

      // Skip empty rows
      // Some exports put all questions into a single row where:
      // - image is a JSON map of { QIDxxx: url }
      // - selectionsData is a JSON map of { QIDxxx: SelectionDto[] }
      // - metadata is a JSON map of { QIDxxx: { width, height, imageScaleFactor } }
      // In that case `questionId` may be empty. We only require selectionsData + image.
      if (!row || !row.selectionsData || !row.image) {
        continue
      }

      try {
        const demographics: Record<string, string> = {}
        allColumns.forEach((key) => {
          if (CORE_COLUMNS.includes(key)) return
          const value = (row as unknown as Record<string, unknown>)[key]
          if (value !== undefined && value !== null && `${value}`.trim() !== '') {
            demographics[key] = `${value}`
          }
        })

        // Parse selectionsData - it's a JSON object with questionId as key
        let selectionsDataObj: Record<string, SelectionDto[]> = {}
        if (row.selectionsData && row.selectionsData.trim()) {
          selectionsDataObj = JSON.parse(row.selectionsData)
        }

        // Parse metadata - it's a JSON object with questionId as key
        let metadataObj: Record<string, { width?: number; height?: number; imageScaleFactor?: number }> = {}
        if (row.metadata && row.metadata.trim()) {
          metadataObj = JSON.parse(row.metadata)
        }

        // Parse image column. It may be:
        // - A single URL string
        // - A JSON map of { QIDxxx: url }
        let imagesObj: Record<string, string> | null = null
        const rawImageValue = `${row.image}`.trim()
        if (rawImageValue.startsWith("{")) {
          try {
            const parsed = JSON.parse(rawImageValue)
            if (parsed && typeof parsed === "object") imagesObj = parsed as Record<string, string>
          } catch {
            imagesObj = null
          }
        }

        const normalizeQidKey = (qid: string) => {
          const trimmed = (qid || "").trim()
          if (!trimmed) return ""
          return trimmed.startsWith("QID") ? trimmed : `QID${trimmed.replace(/^QID/i, "")}`
        }

        // Determine which QIDs to expand for this row.
        let qidKeys: string[] = []
        const rowQidKey = normalizeQidKey(row.questionId || "")
        if (rowQidKey) qidKeys = [rowQidKey]
        else if (imagesObj) qidKeys = Object.keys(imagesObj)
        else qidKeys = Object.keys(selectionsDataObj)

        // Fallback if everything is empty (avoid silently dropping)
        if (qidKeys.length === 0) continue

        qidKeys.forEach((qidKey) => {
          const numericQuestionId = parseInt(qidKey.replace(/^QID/i, "")) || 0
          const selectionData: SelectionDto[] = selectionsDataObj[qidKey] || []
          const metadata = metadataObj[qidKey] || {}
          const scaleFactor = metadata.imageScaleFactor || 1
          const imageWidth = metadata.width || 723
          const imageHeight = metadata.height || 534
          const imagePath = (imagesObj ? imagesObj[qidKey] : rawImageValue) || ""

          const imageName = numericQuestionId ? `Question ${numericQuestionId}` : qidKey

          annotations.push({
            imageName,
            questionId: numericQuestionId,
            selections: selectionData.map((selection: SelectionDto) => {
              const start = selection.start || { x: 0, y: 0 }
              const end = selection.end || { x: 0, y: 0 }

              return {
                uid: Math.random().toString(36).substring(7),
                start,
                end,
                functionValue: (selection.functionValue === 'good' || selection.functionValue === 'bad')
                  ? selection.functionValue
                  : null,
                aestheticValue: (selection.aestheticValue === 'good' || selection.aestheticValue === 'bad')
                  ? selection.aestheticValue
                  : null,
                comment: selection.comment || "",
                show: true
              }
            }),
            image: "",
            imagePath,
            scaleFactor,
            width: imageWidth,
            height: imageHeight,
            demographics,
          })
        })
      } catch (error) {
        console.error(`Error parsing row ${i}:`, error, row)
        // Continue to next row if there's an error
      }
    }

    setAnnotations(annotations)

    // Create buckets for annotations - group by questionId (compact, sorted)
    const bucketsByQuestionId = new Map<number, Annotation[]>()

    annotations.forEach((annotation) => {
      annotation.selections.forEach(selection => {
        selection.show = checkForIniitalShowEligibility(selection)
        selection.uid = Math.random().toString(36).substring(7)
      })
      annotation.show = true
      const key = annotation.questionId || 0
      if (!bucketsByQuestionId.has(key)) bucketsByQuestionId.set(key, [])
      bucketsByQuestionId.get(key)!.push(annotation)
    })

    const sortedQuestionIds = Array.from(bucketsByQuestionId.keys()).sort((a, b) => a - b)
    const buckets: Annotation[][] = sortedQuestionIds.map((qid) => bucketsByQuestionId.get(qid)!)

    setBaseAggregatedAnnotations(buckets)
    const filteredBuckets = applyDemographicFilters(buckets, {})
    setActiveAnnotation(getVisibleAnnotationIndex(filteredBuckets, activeAnnotation))
    setAggregatedAnnotations(filteredBuckets)

    // After cleanup + import completes, open demographic selection if any demographic columns exist.
    setDemographicModalOpen(demographicColumns.length > 0)
  }

  const applyCsvCleanupAndContinue = () => {
    const cols = [...csvCleanupColumns]
    const rows = [...csvCleanupRows]
    resetCsvCleanupState()
    importFromCsvData(rows, cols)
  }

  const parseCsvFileData = (csvFile: File) => {
    Papa.parse(csvFile, {
      header: true,
      complete: function(results: Papa.ParseResult<Record<string, unknown>>) {
        const allColumns: string[] = (results.meta?.fields?.filter((field: string) => !!field)) || []
        const parsedRows: Record<string, unknown>[] = (results.data || []) as Record<string, unknown>[]
        const nonEmptyRows = parsedRows.filter((row) => {
          if (!row || typeof row !== 'object') return false
          return Object.values(row).some((v) => `${v ?? ''}`.trim() !== '')
        })

        // Open cleanup grid prior to demographic selection.
        setCsvCleanupColumns(allColumns)
        setCsvCleanupRows(nonEmptyRows)
        setCsvCleanupOpen(true)
      },
      error: function(error: Papa.ParseError) {
        console.error('Error parsing CSV:', error)
      }
    })
  }

  const currentAnnotationComments =
    activeAnnotation === -1
      ? aggregatedAnnotations.flat().flatMap(annotation => annotation.selections)
      : aggregatedAnnotations[activeAnnotation]
        ?.flatMap(annotation => annotation.selections) ?? []

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
    const sourceAggregatedAnnotations = baseAggregatedAnnotations.length > 0 ? baseAggregatedAnnotations : aggregatedAnnotations
    const updatedAggregatedAnnotations = sourceAggregatedAnnotations.map((question) => {
      const updatedQuestions = question.map((annotation) => {
        return { ...annotation, show: annotation.imageName.toLowerCase().includes(cleanedSearchText) }
      })
      return updatedQuestions
    })
    setBaseAggregatedAnnotations(updatedAggregatedAnnotations)
    const withDemographicFilters = applyDemographicFilters(updatedAggregatedAnnotations, demographicSelections)
    setAggregatedAnnotations(withDemographicFilters)
    setActiveAnnotation(getVisibleAnnotationIndex(withDemographicFilters, activeAnnotation))
  }


  /**
   * Handle case insensitive search for comments, and update the show status of the selections.
   * @param searchText - The text to search for.
   */
  const handleSearchComments = (searchText: string) => {
    const cleanedSearchText = searchText.trim().toLowerCase()
    const sourceAggregatedAnnotations = baseAggregatedAnnotations.length > 0 ? baseAggregatedAnnotations : aggregatedAnnotations
    const updatedAggregatedAnnotations = sourceAggregatedAnnotations.map((question) => {
      const updatedQuestions = question.map((annotation) => {
        const updatedSelections = annotation.selections.map((selection) =>
          ({ ...selection, show: selection.comment.toLowerCase().includes(cleanedSearchText) }))
        return { ...annotation, selections: updatedSelections }
      })
      return updatedQuestions
    })
    setBaseAggregatedAnnotations(updatedAggregatedAnnotations)
    const withDemographicFilters = applyDemographicFilters(updatedAggregatedAnnotations, demographicSelections)
    setAggregatedAnnotations(withDemographicFilters)
  }

  const handleDemographicFilterChange = (key: string, values: string[]) => {
    const updatedFilters = demographicFilters.map((filter) =>
      filter.key === key ? { ...filter, selectedValues: values } : filter
    )
    const updatedSelections = { ...demographicSelections, [key]: values }
    setDemographicFilters(updatedFilters)
    setDemographicSelections(updatedSelections)
    const withDemographicFilters = applyDemographicFilters(
      baseAggregatedAnnotations.length > 0 ? baseAggregatedAnnotations : aggregatedAnnotations,
      updatedSelections
    )
    setAggregatedAnnotations(withDemographicFilters)
    setActiveAnnotation(getVisibleAnnotationIndex(withDemographicFilters, activeAnnotation))
  }

  const togglePendingColumn = (column: string) => {
    setPendingDemographicColumns((prev) => {
      if (prev.includes(column)) {
        return prev.filter((c) => c !== column)
      }
      return [...prev, column]
    })
  }

  const toggleAllPendingColumns = () => {
    if (pendingDemographicColumns.length === availableDemographicColumns.length) {
      setPendingDemographicColumns([])
      return
    }
    setPendingDemographicColumns(availableDemographicColumns)
  }

  const handleConfirmDemographics = () => {
    const sourceAggregatedAnnotations = baseAggregatedAnnotations.length > 0 ? baseAggregatedAnnotations : aggregatedAnnotations
    if (pendingDemographicColumns.length === 0) {
      setDemographicFilters([])
      setDemographicSelections({})
      setPendingDemographicLabels({})
      setDemographicSearchTerm('')
      const resetAggregated = applyDemographicFilters(sourceAggregatedAnnotations, {})
      setAggregatedAnnotations(resetAggregated)
      setDemographicModalOpen(false)
      setActiveAnnotation(getVisibleAnnotationIndex(resetAggregated, activeAnnotation))
      return
    }

    const flatAnnotations = sourceAggregatedAnnotations.flat()
    const filters: DemographicFilter[] = pendingDemographicColumns.map((column) => {
      const uniqueValues = Array.from(new Set(
        flatAnnotations
          .map((annotation) => annotation.demographics?.[column])
          .filter((value): value is string => !!value)
      ))

      return {
        key: column,
        label: pendingDemographicLabels[column] || column,
        options: uniqueValues.map((value) => ({ value, label: value })),
        selectedValues: []
      }
    })

    const emptySelections = Object.fromEntries(pendingDemographicColumns.map((column) => [column, []])) as Record<string, string[]>

    setDemographicFilters(filters)
    setDemographicSelections(emptySelections)
    setDemographicSearchTerm('')
    const withDemographicFilters = applyDemographicFilters(sourceAggregatedAnnotations, emptySelections)
    setAggregatedAnnotations(withDemographicFilters)
    setActiveAnnotation(getVisibleAnnotationIndex(withDemographicFilters, activeAnnotation))
    setDemographicModalOpen(false)
  }

  // Calculate pagination values
  // Comment filtering rules:
  // 1) No annotation selected  -> show all comments
  // 2) Annotation selected, no selection drawn -> show all comments for that annotation
  // 3) Annotation selected, selection drawn -> show comments within that selection
  const filteredComments = currentAnnotationComments
    // Respect per-selection visibility (search toggles)
    .filter((selection) => selection.show !== false)
    .filter((selection) => {
      if (!activeSelection) return true
      return isSelectionContained(activeSelection, selection)
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

      <Dialog
        open={csvCleanupOpen}
        onOpenChange={(open) => {
          setCsvCleanupOpen(open)
          if (!open) resetCsvCleanupState()
        }}
      >
        <DialogContent className="bg-white text-black border border-gray-300 shadow-2xl max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Review CSV (remove rows / columns)</DialogTitle>
            <DialogDescription>
              Hover a column header or row number to remove it before choosing demographic columns.
              <span className="block mt-1 text-xs text-gray-500">
                Note: <code>selectionsData</code> and <code>image</code> can’t be removed because they’re required for annotations.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                Columns: <b>{csvCleanupColumns.length}</b> · Rows: <b>{csvCleanupRows.length}</b>
              </span>
              {csvCleanupRows.length > 50 && (
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
                    {csvCleanupColumns.map((column) => {
                      const isRequired = column === 'selectionsData' || column === 'image'
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
                              onClick={() => removeCsvColumn(column)}
                              aria-label={`Remove column ${column}`}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </button>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {csvCleanupRows.slice(0, 50).map((row, rowIndex) => (
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
                            onClick={() => removeCsvRow(rowIndex)}
                            aria-label={`Remove row ${rowIndex + 1}`}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      {csvCleanupColumns.map((column) => {
                        const raw = (row as Record<string, unknown>)[column]
                        const display = raw === undefined || raw === null ? "" : `${raw}`
                        return (
                          <td
                            key={column}
                            className="border-b border-r px-3 py-2 max-w-[260px] truncate"
                            title={display}
                          >
                            {display}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  {csvCleanupRows.length === 0 && (
                    <tr>
                      <td
                        className="px-3 py-6 text-center text-sm text-gray-500"
                        colSpan={Math.max(1, csvCleanupColumns.length + 1)}
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
            <Button variant="outline" onClick={resetCsvCleanupState} className="hover:bg-[#e9e9e9]">
              Cancel
            </Button>
            <Button
              onClick={applyCsvCleanupAndContinue}
              disabled={csvCleanupColumns.length === 0 || csvCleanupRows.length === 0}
              className="bg-black text-white hover:bg-[#333]"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={demographicModalOpen} onOpenChange={setDemographicModalOpen}>
        <DialogContent className="bg-white text-black border border-gray-300 shadow-2xl max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {demographicModalStep === 'select' ? 'Choose demographic columns' : 'Rename demographic columns'}
            </DialogTitle>
            <DialogDescription>
              {demographicModalStep === 'select'
                ? 'Pick which CSV columns should become User Demographic filters.'
                : 'Optionally rename the selected columns to friendly labels.'}
            </DialogDescription>
          </DialogHeader>

          {demographicModalStep === 'select' && (
            <div className="flex flex-col gap-3 overflow-hidden">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 border p-2 rounded text-sm"
                  placeholder="Search columns"
                  value={demographicSearchTerm}
                  onChange={(event) => setDemographicSearchTerm(event.target.value)}
                />
                <Button variant="outline" onClick={toggleAllPendingColumns} className="text-xs px-3 py-2">
                  {pendingDemographicColumns.length === availableDemographicColumns.length ? 'Clear all' : 'Select all'}
                </Button>
              </div>

              <div className="max-h-64 overflow-auto border rounded bg-[#fafafa] p-2 flex flex-col gap-2">
                {availableDemographicColumns
                  .filter((column) => column.toLowerCase().includes(demographicSearchTerm.toLowerCase()))
                  .map((column) => {
                    const checked = pendingDemographicColumns.includes(column)
                    return (
                      <label
                        key={column}
                        className="flex items-center gap-2 text-sm cursor-pointer rounded px-2 py-1 hover:bg-[#e9e9e9]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePendingColumn(column)}
                          className="accent-black"
                        />
                        <span className="truncate" title={column}>{column}</span>
                      </label>
                    )
                  })}

                {availableDemographicColumns
                  .filter((column) => column.toLowerCase().includes(demographicSearchTerm.toLowerCase()))
                  .length === 0 && (
                    <span className="text-xs text-gray-500">
                      No columns match your search.
                    </span>
                  )}
                {availableDemographicColumns.length === 0 && (
                  <span className="text-xs text-gray-500">
                    No additional columns were detected in this CSV.
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600">
                Selected {pendingDemographicColumns.length} / {availableDemographicColumns.length}
              </span>
            </div>
          )}

          {demographicModalStep === 'rename' && (
            <div className="flex flex-col gap-3 overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 max-h-[55vh]">
                <div className="flex flex-col gap-3">
                  {pendingDemographicColumns.map((column) => (
                    <div key={column} className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-600">CSV Column: {column}</span>
                      <input
                        className="border p-2 rounded"
                        value={pendingDemographicLabels[column] || ''}
                        onChange={(event) =>
                          setPendingDemographicLabels({ ...pendingDemographicLabels, [column]: event.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            {demographicModalStep === 'rename' && (
              <Button
                variant="outline"
                onClick={() => setDemographicModalStep('select')}
                className="hover:bg-[#e9e9e9]"
              >
                Back
              </Button>
            )}
            <Button
              disabled={demographicModalStep === 'select' && pendingDemographicColumns.length === 0}
              onClick={
                demographicModalStep === 'select'
                  ? () => setDemographicModalStep('rename')
                  : handleConfirmDemographics
              }
              className="bg-black text-white hover:bg-[#333]"
            >
              {demographicModalStep === 'select' ? 'Next' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={execSummaryImportOpen}
        onOpenChange={(open) => {
          setExecSummaryImportOpen(open)
          if (!open) {
            setExecSummaryImportError(null)
            setExecSummaryImportText('')
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
              ref={execSummaryTextareaRef}
              value={execSummaryImportText}
              onChange={(e) => setExecSummaryImportText(e.target.value)}
              rows={10}
              placeholder={`{\n  "summary": "...",\n  "analysis": ["..."],\n  "strengths": "...",\n  "improvements": "..."\n}`}
              className="w-full border rounded p-2 text-sm font-mono bg-white"
            />
            {execSummaryImportError && (
              <span className="text-xs text-red-600">{execSummaryImportError}</span>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setExecSummaryImportOpen(false)}
              className="hover:bg-[#e9e9e9]"
            >
              Cancel
            </Button>
            <Button
              onClick={importExecutiveSummaryFromText}
              className="bg-black text-white hover:bg-[#333]"
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    .map((annotation, originalIndex) => {
                      // Only show if annotation has items and is marked to show
                      if (!annotation || annotation.length === 0 || !annotation[0]?.show) {
                        return null;
                      }
                      return { annotation, originalIndex };
                    })
                    .filter((item): item is { annotation: Annotation[]; originalIndex: number } => item !== null)
                    .map(({ annotation, originalIndex }) => (
                      <SelectionThumbnail
                        key={originalIndex}
                        annotations={annotation}
                        width={annotation[0]?.width || 410}
                        height={annotation[0]?.height || 270}
                        onClick={handleSelection(originalIndex)}
                        isActive={activeAnnotation === originalIndex}
                        showHeatmap={showThumbnailHeatmap}
                      />
                    ))}
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
                    Question {aggregatedAnnotations.length}
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
                          annotations={aggregatedAnnotations[activeAnnotation] || []}
                          activeComment={activeComment}
                          canvasWidth={
                            aggregatedAnnotations[activeAnnotation]?.[0]?.width || 723
                          }
                          canvasHeight={
                            aggregatedAnnotations[activeAnnotation]?.[0]?.height || 534
                          }
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
                            feedbackFilters.map((filterGroup) => (
                              <div key={filterGroup.group} className="flex flex-col">
                                <div className="w-[100%] flex justify-between">
                                  <span className="text-xs font-medium">{filterGroup.group}</span>
                                  <span className="text-xs font-medium">Total: {filterGroup.groupCount}</span>
                                </div>
                                <div className="flex flex-col gap-1 my-2">
                                  {
                                    filterGroup.filters.map((filter) => (
                                      <div key={filter.id} className="flex justify-between items-center">
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
                              </div>
                            ))
                          }
                        </CardContent>
                      </Card>

                      <Card className="w-[100%]">
                        <CardHeader className="m-2 p-3 border-1 rounded-lg bg-[#f3f3f3]">
                          <b className="text-xs">User Demographics</b>
                        </CardHeader>
                        <CardContent className="px-3 w-[100%] flex flex-col gap-3">
                          {demographicFilters.length === 0 && (
                            <span className="text-xs text-gray-500">
                              Import a CSV and choose demographic columns to enable filters.
                            </span>
                          )}
                          {demographicFilters.map((filter) => (
                            <div key={filter.key} className="flex flex-col gap-1 my-1">
                              <div className="w-[100%] flex justify-between">
                                <span className="text-xs font-medium">{filter.label}</span>
                              </div>
                              <MultiSelect
                                key={`${filter.key}-${filter.selectedValues.join('|')}`}
                                options={filter.options}
                                onValueChange={(values) => handleDemographicFilterChange(filter.key, values)}
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
                            {currentAnnotationComments.length} Comments
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="bg-white"
                          onClick={() => {
                            setExecSummaryImportError(null)
                            setExecSummaryImportOpen(true)
                            setTimeout(() => execSummaryTextareaRef.current?.focus(), 0)
                          }}
                        >
                          Import JSON
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-white"
                          onClick={clearExecutiveSummaryForCurrent}
                          disabled={activeAnnotation === -1 || !getCurrentExecutiveSummary()}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {getCurrentExecutiveSummary() && (
                    <>
                      <div>
                        <h2>Key Findings</h2>
                        <p className='text-gray-600 text-sm'>
                          {getCurrentExecutiveSummary()!.summary}
                        </p>
                      </div>
                      <div className="border-t border-gray-600 my-3"></div>
                      <div>
                        <h2>Critical Analysis</h2>
                        <ul className='list-inside list-disc text-gray-600 text-sm'>
                          {getCurrentExecutiveSummary()!.analysis.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                </CardContent>

                <CardFooter>
                  {getCurrentExecutiveSummary() && (
                    <div className='flex flex-col gap-2 w-[100%]'>
                      <div className='flex gap-2 flex-wrap md:flex-nowrap'>

                        <div className='bg-[#F4FDF7] text-[#85A389] flex flex-col md:w-1/2 p-2'>
                          <b>Strengths</b>
                          <span className='text-sm'>
                            {getCurrentExecutiveSummary()!.strengths}
                          </span>
                        </div>

                        <div className='bg-[#FEF5F5] text-[#CB7D7A] flex flex-col md:w-1/2 p-2'>
                          <b>Area of Improvements</b>
                          <span className='text-sm'>
                            {getCurrentExecutiveSummary()!.improvements}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardFooter>
              </Card>
            }

            {/* Feedback Comments */}
            {
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
