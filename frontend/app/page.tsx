'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Event {
  ts: string
  type: string
  data: any
}

export default function Home() {
  const [problem, setProblem] = useState('')
  const [runId, setRunId] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!problem.trim()) {
      alert('Please enter a problem')
      return
    }

    setLoading(true)
    setEvents([])
    setStatus('Creating run...')

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
      setStatus('Run created, connecting to event stream...')

      // Connect to SSE stream
      const eventSource = new EventSource(`${API_URL}/api/runs/${newRunId}/events`)

      eventSource.onmessage = (event) => {
        const eventData = JSON.parse(event.data)
        setEvents((prev) => [...prev, eventData])
        setStatus(`Event: ${eventData.type}`)
      }

      eventSource.onerror = () => {
        eventSource.close()
        setStatus('Stream closed')
        setLoading(false)
      }

    } catch (error) {
      console.error('Error:', error)
      setStatus(`Error: ${error}`)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Step-Chain Runner
        </h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label
              htmlFor="problem"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Enter your problem:
            </label>
            <textarea
              id="problem"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Describe the problem you want to solve..."
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Running...' : 'Run'}
          </button>
        </form>

        {status && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{status}</p>
          </div>
        )}

        {runId && (
          <div className="mb-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Run ID:</span> {runId}
            </p>
          </div>
        )}

        {events.length > 0 && (
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Events Log
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 border border-gray-200 rounded text-sm"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-900">
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.ts).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
