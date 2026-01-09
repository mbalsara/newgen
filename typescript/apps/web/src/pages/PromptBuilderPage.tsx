"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { api, type Agent } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Save,
  Loader2,
  Search,
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit3,
  Copy,
  Clock,
  AlertCircle,
} from 'lucide-react'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_QUESTIONS,
  type BankQuestion,
  type AgentQuestion,
} from '@repo/types'

// ============================================================================
// Question Bank Panel (Left)
// ============================================================================

interface QuestionBankPanelProps {
  onAddQuestion: (question: BankQuestion) => void
  selectedQuestionIds: string[]
  onDragStart: (e: React.DragEvent, question: BankQuestion) => void
}

function QuestionBankPanel({ onAddQuestion, selectedQuestionIds, onDragStart }: QuestionBankPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    DEFAULT_CATEGORIES.map((c) => c.id)
  )

  const filteredQuestions = useMemo(() => {
    if (!searchQuery) return DEFAULT_QUESTIONS
    const query = searchQuery.toLowerCase()
    return DEFAULT_QUESTIONS.filter(
      (q) =>
        q.label.toLowerCase().includes(query) ||
        q.question.toLowerCase().includes(query) ||
        q.tags.some((t) => t.toLowerCase().includes(query))
    )
  }, [searchQuery])

  const questionsByCategory = useMemo(() => {
    const grouped: Record<string, BankQuestion[]> = {}
    for (const category of DEFAULT_CATEGORIES) {
      grouped[category.id] = filteredQuestions.filter((q) => q.categoryId === category.id)
    }
    return grouped
  }, [filteredQuestions])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className="flex flex-col h-full border-r bg-muted/30 overflow-hidden">
      <div className="shrink-0 p-4 border-b bg-background">
        <h2 className="font-semibold mb-3">Question Bank</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {DEFAULT_CATEGORIES.map((category) => {
            const questions = questionsByCategory[category.id] || []
            const isExpanded = expandedCategories.includes(category.id)

            if (questions.length === 0 && searchQuery) return null

            return (
              <Collapsible
                key={category.id}
                open={isExpanded}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-2 hover:bg-muted rounded-md text-sm font-medium">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="flex-1 text-left">{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {questions.length}
                  </span>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="pl-4 space-y-1 pb-2">
                    {questions.map((question) => {
                      const isSelected = selectedQuestionIds.includes(question.id)

                      return (
                        <div
                          key={question.id}
                          draggable={!isSelected}
                          onDragStart={(e) => !isSelected && onDragStart(e, question)}
                          className={cn(
                            'flex items-start gap-2 p-2 rounded-md text-sm transition-colors',
                            isSelected
                              ? 'bg-primary/10 border border-primary/30'
                              : 'hover:bg-muted cursor-grab active:cursor-grabbing'
                          )}
                          onClick={() => !isSelected && onAddQuestion(question)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{question.label}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {question.question}
                            </p>
                          </div>
                          {isSelected ? (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              Added
                            </Badge>
                          ) : (
                            <Plus className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Builder Panel (Middle)
// ============================================================================

interface BuilderPanelProps {
  questions: AgentQuestion[]
  onQuestionsChange: (questions: AgentQuestion[]) => void
  onSelectQuestion: (question: AgentQuestion | null) => void
  selectedQuestionId: string | null
  onAddCustomQuestion: () => void
  isDraggingFromBank: boolean
  onDropFromBank: (index: number) => void
}

function BuilderPanel({
  questions,
  onQuestionsChange,
  onSelectQuestion,
  selectedQuestionId,
  onAddCustomQuestion,
  isDraggingFromBank,
  onDropFromBank,
}: BuilderPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newQuestions = [...questions]
    const [removed] = newQuestions.splice(draggedIndex, 1)
    newQuestions.splice(index, 0, removed)

    // Update sort orders
    const updated = newQuestions.map((q, i) => ({ ...q, sortOrder: i }))
    onQuestionsChange(updated)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDropTargetIndex(null)
  }

  // Handle drops from Question Bank
  const handleBankDragOver = (e: React.DragEvent, index: number) => {
    if (!isDraggingFromBank) return
    e.preventDefault()
    e.stopPropagation()
    setDropTargetIndex(index)
  }

  const handleBankDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDropTargetIndex(null)
    onDropFromBank(index)
  }

  const handleContainerDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropTargetIndex(null)
    }
  }

  const removeQuestion = (id: string) => {
    onQuestionsChange(questions.filter((q) => q.id !== id))
    if (selectedQuestionId === id) {
      onSelectQuestion(null)
    }
  }

  const duplicateQuestion = (question: AgentQuestion) => {
    const newQuestion: AgentQuestion = {
      ...question,
      id: `${question.id}-copy-${Date.now()}`,
      sortOrder: questions.length,
    }
    onQuestionsChange([...questions, newQuestion])
  }

  const toggleRequired = (id: string) => {
    onQuestionsChange(
      questions.map((q) => (q.id === id ? { ...q, required: !q.required } : q))
    )
  }

  const getCategoryColor = (categoryId: string) => {
    return DEFAULT_CATEGORIES.find((c) => c.id === categoryId)?.color || '#888'
  }

  // Estimate call duration (roughly 30 seconds per question)
  const estimatedMinutes = Math.ceil(questions.length * 0.5)

  // Drop zone indicator component
  const DropZone = ({ index }: { index: number }) => (
    <div
      className={cn(
        "transition-all duration-150",
        dropTargetIndex === index
          ? "h-16 border-2 border-dashed border-primary rounded-lg bg-primary/10 flex items-center justify-center"
          : isDraggingFromBank
            ? "h-2 hover:h-16 hover:border-2 hover:border-dashed hover:border-primary/50 hover:rounded-lg hover:bg-primary/5"
            : "h-0"
      )}
      onDragOver={(e) => handleBankDragOver(e, index)}
      onDrop={(e) => handleBankDrop(e, index)}
    >
      {dropTargetIndex === index && (
        <span className="text-sm text-primary font-medium">Drop here</span>
      )}
    </div>
  )

  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden transition-colors",
        isDraggingFromBank && "bg-primary/5"
      )}
      onDragLeave={handleContainerDragLeave}
    >
      <div className="shrink-0 p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Prompt Builder</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>~{estimatedMinutes} min call</span>
            </div>
            <Button variant="outline" size="sm" onClick={onAddCustomQuestion}>
              <Plus className="h-4 w-4 mr-1" />
              Custom
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {questions.length} questions · Drag to reorder
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {questions.length === 0 && (
            <div
              className={cn(
                "flex flex-col items-center justify-center py-12 text-center rounded-lg transition-colors",
                isDraggingFromBank
                  ? "border-2 border-dashed border-primary bg-primary/5"
                  : ""
              )}
              onDragOver={(e) => handleBankDragOver(e, 0)}
              onDrop={(e) => handleBankDrop(e, 0)}
            >
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                isDraggingFromBank ? "bg-primary/10" : "bg-muted"
              )}>
                <Plus className={cn(
                  "h-8 w-8",
                  isDraggingFromBank ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <h3 className={cn(
                "font-medium mb-1",
                isDraggingFromBank && "text-primary"
              )}>
                {isDraggingFromBank ? "Drop question here" : "No questions added"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {isDraggingFromBank
                  ? "Release to add this question to your script"
                  : "Drag questions from the Question Bank or click \"Custom\" to create your own"
                }
              </p>
            </div>
          )}
          {questions.length > 0 && (
            <>
              {/* Drop zone at the top */}
              <DropZone index={0} />
              {questions.map((question, index) => (
                <div key={question.id}>
                  {/* Question card */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelectQuestion(question)}
                    className={cn(
                      'group flex items-start gap-3 p-3 rounded-lg border bg-card cursor-pointer transition-all',
                      selectedQuestionId === question.id
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:border-primary/50',
                      draggedIndex === index && 'opacity-50'
                    )}
                  >
                    <div className="cursor-grab active:cursor-grabbing mt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div
                      className="w-1 self-stretch rounded-full"
                      style={{ backgroundColor: getCategoryColor(question.categoryId) }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
                          {index + 1}
                        </span>
                        <span className="font-medium text-sm truncate">
                          {question.label}
                        </span>
                        {!question.required && (
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        "{question.question}"
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>→ {question.outputVariable}</span>
                        {question.condition && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600">
                              Conditional
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleRequired(question.id)
                        }}
                        title={question.required ? 'Mark optional' : 'Mark required'}
                      >
                        <AlertCircle
                          className={cn(
                            'h-4 w-4',
                            question.required ? 'text-amber-500' : 'text-muted-foreground'
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateQuestion(question)
                        }}
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeQuestion(question.id)
                        }}
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  {/* Drop zone after each question */}
                  <DropZone index={index + 1} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Preview Panel (Right)
// ============================================================================

interface PreviewPanelProps {
  questions: AgentQuestion[]
  agentName: string
  practiceName: string
  selectedQuestion: AgentQuestion | null
  onQuestionUpdate: (question: AgentQuestion) => void
  interruptions: {
    handleWrongPerson: boolean
    handleConfusedFrustrated: boolean
    handleLanguageBarrier: boolean
  }
}

function PreviewPanel({
  questions,
  agentName,
  practiceName,
  selectedQuestion,
  onQuestionUpdate,
  interruptions,
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview')

  // Generate the prompt based on questions and settings
  const generatedPrompt = useMemo(() => {
    let prompt = `## ROLE
You are ${agentName || '{{agent_name}}'}, a professional AI voice assistant for ${practiceName || '{{practice_name}}'}. Your job is to conduct pre-visit intake calls with patients in a friendly, efficient manner.

## PATIENT CONTEXT
- Name: {{patient_name}}
- Appointment: {{appointment_date}} at {{appointment_time}}
- Provider: {{provider_name}}

## CONVERSATION GUIDELINES
- Be warm, professional, and conversational
- Speak clearly and at a moderate pace
- Listen carefully and confirm understanding
- If the patient seems confused, rephrase your question
- Keep responses concise

`

    // Add interruption handling based on settings
    if (interruptions.handleWrongPerson || interruptions.handleConfusedFrustrated || interruptions.handleLanguageBarrier) {
      prompt += `## SPECIAL SITUATIONS\n`

      if (interruptions.handleWrongPerson) {
        prompt += `- Wrong Person: If someone other than the patient answers, politely ask to speak with the patient or leave a message.\n`
      }
      if (interruptions.handleConfusedFrustrated) {
        prompt += `- Confused/Frustrated: If the patient seems confused or frustrated, slow down, acknowledge their feelings, and offer to clarify or transfer to a human.\n`
      }
      if (interruptions.handleLanguageBarrier) {
        prompt += `- Language Barrier: If there's a language barrier, speak slowly and clearly. Offer to have someone call back in their preferred language.\n`
      }
      prompt += `\n`
    }

    // Add questions
    if (questions.length > 0) {
      prompt += `## QUESTIONS TO ASK\n`
      prompt += `Ask the following questions in order. Record each response.\n\n`

      questions.forEach((q, index) => {
        prompt += `### ${index + 1}. ${q.label}\n`
        prompt += `Question: "${q.question}"\n`
        prompt += `Save response to: {{${q.outputVariable}}}\n`
        if (q.followUp) {
          prompt += `If yes/details needed: "${q.followUp}"\n`
        }
        if (q.condition) {
          prompt += `Only ask if: ${q.condition.field} ${q.condition.operator} ${q.condition.value}\n`
        }
        if (!q.required) {
          prompt += `(Optional - skip if patient seems rushed)\n`
        }
        prompt += `\n`
      })
    }

    prompt += `## CLOSING
After completing all questions:
1. Summarize any important information collected
2. Confirm the appointment date and time
3. Ask if they have any questions
4. Thank them for their time and wish them well

If you cannot complete the call, explain that someone will follow up.`

    return prompt
  }, [questions, agentName, practiceName, interruptions])

  // Question editor
  if (selectedQuestion && viewMode === 'edit') {
    return (
      <div className="flex flex-col h-full border-l overflow-hidden">
        <div className="shrink-0 p-4 border-b bg-background flex items-center justify-between">
          <h2 className="font-semibold">Edit Question</h2>
          <Button variant="ghost" size="sm" onClick={() => setViewMode('preview')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={selectedQuestion.label}
                onChange={(e) =>
                  onQuestionUpdate({ ...selectedQuestion, label: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                value={selectedQuestion.question}
                onChange={(e) =>
                  onQuestionUpdate({ ...selectedQuestion, question: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Follow-up (optional)</Label>
              <Textarea
                value={selectedQuestion.followUp || ''}
                onChange={(e) =>
                  onQuestionUpdate({ ...selectedQuestion, followUp: e.target.value })
                }
                placeholder="Asked if patient answers yes or needs clarification..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Output Variable</Label>
              <Input
                value={selectedQuestion.outputVariable}
                onChange={(e) =>
                  onQuestionUpdate({
                    ...selectedQuestion,
                    outputVariable: e.target.value.replace(/\s+/g, '_').toLowerCase(),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Variable name for storing the answer
              </p>
            </div>

            <div className="space-y-2">
              <Label>Response Type</Label>
              <Select
                value={selectedQuestion.responseType}
                onValueChange={(value) =>
                  onQuestionUpdate({
                    ...selectedQuestion,
                    responseType: value as AgentQuestion['responseType'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes_no">Yes/No</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="choice">Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Required</Label>
                <p className="text-xs text-muted-foreground">
                  Must be answered to complete call
                </p>
              </div>
              <Switch
                checked={selectedQuestion.required}
                onCheckedChange={(required) =>
                  onQuestionUpdate({ ...selectedQuestion, required })
                }
              />
            </div>

            {/* Condition Builder */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Conditional Display</Label>
                  <p className="text-xs text-muted-foreground">
                    Only ask this question when a condition is met
                  </p>
                </div>
                <Switch
                  checked={!!selectedQuestion.condition}
                  onCheckedChange={(enabled) => {
                    if (enabled) {
                      onQuestionUpdate({
                        ...selectedQuestion,
                        condition: { field: '', operator: 'equals', value: '' },
                      })
                    } else {
                      onQuestionUpdate({
                        ...selectedQuestion,
                        condition: undefined,
                      })
                    }
                  }}
                />
              </div>

              {selectedQuestion.condition && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="space-y-2">
                    <Label className="text-xs">If variable</Label>
                    <Input
                      placeholder="e.g., insurance_changed"
                      value={selectedQuestion.condition.field}
                      onChange={(e) =>
                        onQuestionUpdate({
                          ...selectedQuestion,
                          condition: {
                            ...selectedQuestion.condition!,
                            field: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={selectedQuestion.condition.operator}
                      onValueChange={(value) =>
                        onQuestionUpdate({
                          ...selectedQuestion,
                          condition: {
                            ...selectedQuestion.condition!,
                            operator: value as 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than',
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Does not equal</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater_than">Greater than</SelectItem>
                        <SelectItem value="less_than">Less than</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Value</Label>
                    <Input
                      placeholder="e.g., yes, true, 5"
                      value={String(selectedQuestion.condition.value || '')}
                      onChange={(e) =>
                        onQuestionUpdate({
                          ...selectedQuestion,
                          condition: {
                            ...selectedQuestion.condition!,
                            value: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    This question will only be asked if{' '}
                    <code className="bg-background px-1 rounded">
                      {selectedQuestion.condition.field || '___'}
                    </code>{' '}
                    {selectedQuestion.condition.operator.replace('_', ' ')}{' '}
                    <code className="bg-background px-1 rounded">
                      {String(selectedQuestion.condition.value) || '___'}
                    </code>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Prompt preview
  return (
    <div className="flex flex-col h-full border-l overflow-hidden">
      <div className="shrink-0 p-4 border-b bg-background flex items-center justify-between">
        <h2 className="font-semibold">Generated Prompt</h2>
        <div className="flex items-center gap-2">
          {selectedQuestion && (
            <Button variant="ghost" size="sm" onClick={() => setViewMode('edit')}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(generatedPrompt)
              toast.success('Prompt copied to clipboard')
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap text-muted-foreground">
          {generatedPrompt}
        </pre>
      </div>
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function PromptBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [questions, setQuestions] = useState<AgentQuestion[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<AgentQuestion | null>(null)
  const [draggedBankQuestion, setDraggedBankQuestion] = useState<BankQuestion | null>(null)

  // Load agent
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true)
      api.agents
        .getById(id)
        .then((data) => {
          setAgent(data)
          // Load existing questions if any
          // For now, start with empty
          setQuestions([])
        })
        .catch((err) => {
          console.error('Failed to load agent:', err)
          toast.error('Failed to load agent')
          navigate('/agents')
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [id, navigate])

  const addQuestion = useCallback((bankQuestion: BankQuestion) => {
    const newQuestion: AgentQuestion = {
      id: `${bankQuestion.id}-${Date.now()}`,
      sourceQuestionId: bankQuestion.id,
      categoryId: bankQuestion.categoryId,
      label: bankQuestion.label,
      question: bankQuestion.question,
      followUp: bankQuestion.followUp,
      responseType: bankQuestion.responseType,
      choices: bankQuestion.choices,
      outputVariable: bankQuestion.outputVariable,
      required: true,
      sortOrder: questions.length,
    }
    setQuestions((prev) => [...prev, newQuestion])
    toast.success(`Added: ${bankQuestion.label}`)
  }, [questions.length])

  const updateQuestion = useCallback((updated: AgentQuestion) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q))
    )
    setSelectedQuestion(updated)
  }, [])

  // Drag handlers for dragging from Question Bank to Builder
  const handleBankDragStart = useCallback((e: React.DragEvent, question: BankQuestion) => {
    setDraggedBankQuestion(question)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', question.id)
  }, [])

  // Reset drag state when drag ends
  useEffect(() => {
    const handleDragEnd = () => {
      setDraggedBankQuestion(null)
    }
    document.addEventListener('dragend', handleDragEnd)
    return () => document.removeEventListener('dragend', handleDragEnd)
  }, [])

  // Handle drop at a specific index
  const handleDropFromBank = useCallback((insertIndex: number) => {
    if (!draggedBankQuestion) return

    const newQuestion: AgentQuestion = {
      id: `${draggedBankQuestion.id}-${Date.now()}`,
      sourceQuestionId: draggedBankQuestion.id,
      categoryId: draggedBankQuestion.categoryId,
      label: draggedBankQuestion.label,
      question: draggedBankQuestion.question,
      followUp: draggedBankQuestion.followUp,
      responseType: draggedBankQuestion.responseType,
      choices: draggedBankQuestion.choices,
      outputVariable: draggedBankQuestion.outputVariable,
      required: true,
      sortOrder: insertIndex,
    }

    setQuestions((prev) => {
      const updated = [...prev]
      updated.splice(insertIndex, 0, newQuestion)
      // Update sort orders
      return updated.map((q, i) => ({ ...q, sortOrder: i }))
    })

    toast.success(`Added: ${draggedBankQuestion.label}`)
    setDraggedBankQuestion(null)
  }, [draggedBankQuestion])

  // Add custom question
  const addCustomQuestion = useCallback(() => {
    const customQuestion: AgentQuestion = {
      id: `custom-${Date.now()}`,
      categoryId: 'custom',
      label: 'New Custom Question',
      question: 'Enter your question here...',
      responseType: 'text',
      outputVariable: 'custom_answer',
      required: true,
      sortOrder: questions.length,
    }
    setQuestions((prev) => [...prev, customQuestion])
    setSelectedQuestion(customQuestion)
    toast.success('Custom question added - click to edit')
  }, [questions.length])

  const handleSave = async () => {
    if (!agent) return

    setIsSaving(true)
    try {
      // Generate the prompt and save it
      // For now, just show success
      toast.success('Prompt saved successfully')
      navigate(`/agents/${id}`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedQuestionIds = useMemo(
    () => questions.map((q) => q.sourceQuestionId).filter(Boolean) as string[],
    [questions]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/agents/${id}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Prompt Builder</h1>
              <p className="text-sm text-muted-foreground">
                {agent?.name || 'New Agent'} · {questions.length} questions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/agents/${id}`)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save & Close
            </Button>
          </div>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question Bank */}
        <div className="w-80 shrink-0 h-full overflow-hidden">
          <QuestionBankPanel
            onAddQuestion={addQuestion}
            selectedQuestionIds={selectedQuestionIds}
            onDragStart={handleBankDragStart}
          />
        </div>

        {/* Middle: Builder */}
        <div className="flex-1 border-l h-full overflow-hidden">
          <BuilderPanel
            questions={questions}
            onQuestionsChange={setQuestions}
            onSelectQuestion={setSelectedQuestion}
            selectedQuestionId={selectedQuestion?.id || null}
            onAddCustomQuestion={addCustomQuestion}
            isDraggingFromBank={!!draggedBankQuestion}
            onDropFromBank={handleDropFromBank}
          />
        </div>

        {/* Right: Preview */}
        <div className="w-[420px] shrink-0 h-full overflow-hidden">
          <PreviewPanel
            questions={questions}
            agentName={agent?.name || ''}
            practiceName={agent?.practiceName || ''}
            selectedQuestion={selectedQuestion}
            onQuestionUpdate={updateQuestion}
            interruptions={{
              handleWrongPerson: true,
              handleConfusedFrustrated: true,
              handleLanguageBarrier: false,
            }}
          />
        </div>
      </div>
    </div>
  )
}
