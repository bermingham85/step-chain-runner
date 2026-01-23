'use client'

import { useState, useEffect, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'

interface Event {
  ts: string
  type: string
  data: any
}

interface Step {
  number: number
  description: string
  output?: string
  verified?: boolean
  verifyFailed?: boolean
  verifyReason?: string
}

interface Plan {
  step_number: number
  description: string
  verification_checklist: string[]
}

export default function Home() {
  const [problem, setProblem] = useState('')
  const [runId, setRunId] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [status, setStatus] = useState<string>('idle')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step | null>(null)
  const [totalSteps, setTotalSteps] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [finalOutput, setFinalOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [plan, setPlan] = useState<Plan[]>([])
  
  const eventLogRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Auto-scroll event log
  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight
    }
  }, [events])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const formatEventData = (event: Event): string => {
    const { type, data } = event
    
    switch (type) {
      case 'plan_created':
        return `Created plan with ${data.total_steps} steps`
      case 'step_started':
        return `Step ${data.step_number}: ${data.description?.substring(0, 100) || 'Started'}...`
      case 'step_output':
        return `Step ${data.step_number} output received`
      case 'verify_pass':
        return `Step ${data.step_number} verified ✓`
      case 'verify_fail':
        return `Step ${data.step_number} verification failed: ${data.reason?.substring(0, 50) || 'Unknown'}`
      case 'run_completed':
        return 'Run completed successfully!'
      case 'run_failed':
        return `Run failed: ${data.error?.substring(0, 100) || 'Unknown error'}`
      default:
        return JSON.stringify(data).substring(0, 100)
    }
  }

  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'plan_created': return '📋'
      case 'step_started': return '▶️'
      case 'step_output': return '📝'
      case 'verify_pass': return '✅'
      case 'verify_fail': return '❌'
      case 'run_completed': return '🎉'
      case 'run_failed': return '⚠️'
      default: return '📌'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!problem.trim()) {
      setError('Please enter a problem')
      return
    }

    // Reset state
    setLoading(true)
    setEvents([])
    setStatus('queued')
    setCurrentStep(null)
    setTotalSteps(0)
    setCurrentStepIndex(0)
    setFinalOutput(null)
    setError(null)
    setPlan([])
    setCopied(false)

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      // Create run
      const response = await fetch(`${API_URL}/api/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem }),
      })

      if (!response.ok) {
        throw new Error('Failed to create run')
      }

      const data = await response.json()
      const newRunId = data.run_id
      setRunId(newRunId)
      setStatus('running')

      // Connect to SSE stream
      const eventSource = new EventSource(`${API_URL}/api/runs/${newRunId}/events`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        setEvents((prev) => [...prev, eventData])
        
        // Handle different event types
        switch (eventData.type) {
          case 'plan_created':
            setTotalSteps(eventData.data.total_steps)
            setPlan(eventData.data.plan || [])
            break
            
          case 'step_started':
            setCurrentStepIndex(eventData.data.step_number)
            setCurrentStep({
              number: eventData.data.step_number,
              description: eventData.data.description,
            })
            break
            
          case 'step_output':
            setCurrentStep(prev => prev ? {
              ...prev,
              output: eventData.data.output
            } : null)
            break
            
          case 'verify_pass':
            setCurrentStep(prev => prev ? {
              ...prev,
              verified: true
            } : null)
            break
            
          case 'verify_fail':
            setCurrentStep(prev => prev ? {
              ...prev,
              verifyFailed: true,
              verifyReason: eventData.data.reason
            } : null)
            break
            
          case 'run_completed':
            setStatus('completed')
            setFinalOutput(eventData.data.final_output)
            setLoading(false)
            eventSource.close()
            break
            
          case 'run_failed':
            setStatus('failed')
            setError(eventData.data.error)
            setLoading(false)
            eventSource.close()
            break
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        if (status !== 'completed' && status !== 'failed') {
          setLoading(false)
        }
      }

    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('failed')
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (finalOutput) {
      await navigator.clipboard.writeText(finalOutput)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const progressPercent = totalSteps > 0 ? Math.round((currentStepIndex / totalSteps) * 100) : 0

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            ⛓️ Step-Chain Runner
          </h1>
          <p className="text-gray-400">
            Break down complex problems into executable steps
          </p>
        </div>

        {/* Problem Input Section */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label
              htmlFor="problem"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Enter your problem:
            </label>
            <textarea
              id="problem"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full h-32 p-4 bg-gray-800 border border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         text-white placeholder-gray-500 resize-none"
              placeholder="Describe the problem you want to solve..."
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed 
                       font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⚙️</span>
                Running...
              </>
            ) : (
              <>
                ▶️ Run
              </>
            )}
          </button>
        </form>

        {/* Progress Indicator */}
        {status !== 'idle' && totalSteps > 0 && (
          <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm font-medium text-white">
                Step {currentStepIndex} of {totalSteps}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                status === 'completed' ? 'bg-green-900 text-green-300' :
                status === 'failed' ? 'bg-red-900 text-red-300' :
                status === 'running' ? 'bg-blue-900 text-blue-300' :
                'bg-gray-700 text-gray-300'
              }`}>
                {status.toUpperCase()}
              </span>
              <span className="text-sm text-gray-400">{progressPercent}%</span>
            </div>
          </div>
        )}

        {/* Current Step Panel */}
        {currentStep && status === 'running' && (
          <div className="mb-6 p-4 bg-blue-900/30 border-l-4 border-blue-500 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-300 mb-1">
                  Step {currentStep.number} of {totalSteps}
                </h3>
                <p className="text-white mb-2">{currentStep.description}</p>
                {currentStep.output && (
                  <div className="mt-3 p-3 bg-gray-800/50 rounded text-sm text-gray-300 max-h-40 overflow-y-auto">
                    {currentStep.output.substring(0, 500)}
                    {currentStep.output.length > 500 && '...'}
                  </div>
                )}
              </div>
              <div className="ml-4">
                {currentStep.verified && (
                  <span className="text-green-400 text-2xl">✅</span>
                )}
                {currentStep.verifyFailed && (
                  <span className="text-red-400 text-2xl">❌</span>
                )}
                {!currentStep.verified && !currentStep.verifyFailed && (
                  <span className="animate-pulse text-2xl">⏳</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Final Output Section */}
        {finalOutput && (
          <div className="mb-6 p-4 bg-green-900/20 border-2 border-green-500 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-green-400 flex items-center gap-2">
                ✅ Final Output
              </h3>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm 
                           rounded transition-colors duration-200 flex items-center gap-2"
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <div className="text-gray-200 whitespace-pre-wrap bg-gray-800/50 p-4 rounded max-h-96 overflow-y-auto">
              {finalOutput}
            </div>
          </div>
        )}

        {/* Error Section */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border-2 border-red-500 rounded-lg">
            <h3 className="font-semibold text-red-400 flex items-center gap-2 mb-2">
              ⚠️ Error
            </h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Live Event Log */}
        {events.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-750 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                📜 Live Event Log
                <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-400">
                  {events.length} events
                </span>
              </h2>
            </div>
            <div 
              ref={eventLogRef}
              className="p-4 space-y-2 max-h-96 overflow-y-auto"
            >
              {events.map((event, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg 
                             hover:bg-gray-900/70 transition-colors duration-150"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white flex items-center gap-2">
                      <span>{getEventIcon(event.type)}</span>
                      <span className="text-sm">{event.type.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(event.ts).toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {formatEventData(event)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Run ID Display */}
        {runId && (
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-600 font-mono">
              Run ID: {runId}
            </span>
          </div>
        )}
      </div>
    </main>
  )
}
