import { useState, useEffect, useRef } from "react";
import "@/App.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Copy, CheckCheck, Play, AlertCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [problem, setProblem] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runId, setRunId] = useState(null);
  const [runStatus, setRunStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [plan, setPlan] = useState([]);
  const [finalOutput, setFinalOutput] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const eventsEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events]);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleRun = async () => {
    if (!problem.trim()) return;

    // Reset state
    setIsRunning(true);
    setRunId(null);
    setRunStatus(null);
    setEvents([]);
    setCurrentStep(null);
    setPlan([]);
    setFinalOutput(null);
    setError(null);

    try {
      // Create run
      const response = await fetch(`${API}/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ problem }),
      });

      if (!response.ok) {
        throw new Error("Failed to create run");
      }

      const data = await response.json();
      setRunId(data.run_id);

      // Connect to SSE stream
      const eventSource = new EventSource(`${API}/runs/${data.run_id}/events`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const eventData = JSON.parse(event.data);
          setEvents((prev) => [...prev, eventData]);

          // Handle different event types
          switch (eventData.type) {
            case "plan_created":
              setPlan(eventData.data.plan);
              setRunStatus({
                status: "running",
                current_step_index: 0,
                total_steps: eventData.data.total_steps,
              });
              break;

            case "step_started":
              setCurrentStep({
                step_number: eventData.data.step_number,
                description: eventData.data.description,
                output: null,
                verification: null,
              });
              break;

            case "step_output":
              setCurrentStep((prev) => ({
                ...prev,
                output: eventData.data.output,
              }));
              break;

            case "verify_pass":
              setCurrentStep((prev) => ({
                ...prev,
                verification: "pass",
              }));
              setRunStatus((prev) => ({
                ...prev,
                current_step_index: (prev?.current_step_index || 0) + 1,
              }));
              break;

            case "verify_fail":
              setCurrentStep((prev) => ({
                ...prev,
                verification: "fail",
                verification_reason: eventData.data.reason,
              }));
              break;

            case "run_completed":
              setFinalOutput(eventData.data.final_output);
              setRunStatus((prev) => ({ ...prev, status: "completed" }));
              setIsRunning(false);
              eventSource.close();
              break;

            case "run_failed":
              setError(eventData.data.error);
              setRunStatus((prev) => ({ ...prev, status: "failed" }));
              setIsRunning(false);
              eventSource.close();
              break;

            default:
              break;
          }
        } catch (err) {
          console.error("Error parsing event:", err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsRunning(false);
      };
    } catch (err) {
      setError(err.message);
      setIsRunning(false);
    }
  };

  const copyToClipboard = async () => {
    if (finalOutput) {
      try {
        await navigator.clipboard.writeText(finalOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "plan_created":
        return "📋";
      case "step_started":
        return "▶️";
      case "step_output":
        return "💬";
      case "verify_pass":
        return "✅";
      case "verify_fail":
        return "❌";
      case "run_completed":
        return "🎉";
      case "run_failed":
        return "💥";
      default:
        return "📌";
    }
  };

  const getEventLabel = (type) => {
    const labels = {
      plan_created: "Plan Created",
      step_started: "Step Started",
      step_output: "Step Output",
      verify_pass: "Verification Passed",
      verify_fail: "Verification Failed",
      run_completed: "Run Completed",
      run_failed: "Run Failed",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Step-Chain Runner
          </h1>
          <p className="text-slate-600">
            AI-powered step-by-step problem solver
          </p>
        </div>

        {/* Problem Input Section */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Problem Input</CardTitle>
            <CardDescription>
              Describe the problem you want to solve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Describe the problem you want to solve..."
              className="w-full min-h-[120px] p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              disabled={isRunning}
            />
            <Button
              onClick={handleRun}
              disabled={isRunning || !problem.trim()}
              className="mt-4 w-full md:w-auto"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        {runStatus && (
          <Card className="mb-6 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      runStatus.status === "completed"
                        ? "success"
                        : runStatus.status === "failed"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {runStatus.status}
                  </Badge>
                  <span className="text-sm text-slate-600">
                    Step {runStatus.current_step_index} of {runStatus.total_steps}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {runStatus.total_steps > 0
                    ? Math.round(
                        (runStatus.current_step_index / runStatus.total_steps) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <Progress
                value={
                  runStatus.total_steps > 0
                    ? (runStatus.current_step_index / runStatus.total_steps) * 100
                    : 0
                }
                className="h-2"
              />
            </CardContent>
          </Card>
        )}

        {/* Current Step Panel */}
        {currentStep && (
          <Card className="mb-6 shadow-lg border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Step {currentStep.step_number}
                </CardTitle>
                {currentStep.verification && (
                  <div className="flex items-center gap-1">
                    {currentStep.verification === "pass" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              <CardDescription>{currentStep.description}</CardDescription>
            </CardHeader>
            {currentStep.output && (
              <CardContent>
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {currentStep.output}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Event Log */}
          {events.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Live Event Log</CardTitle>
                <CardDescription>
                  Real-time updates from the execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto space-y-3">
                  {events.map((event, index) => (
                    <div
                      key={index}
                      className="flex gap-3 p-3 bg-slate-50 rounded-md border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <div className="text-2xl flex-shrink-0">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-slate-900">
                            {getEventLabel(event.type)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatTimestamp(event.ts)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          {event.type === "plan_created" && (
                            <span>Created plan with {event.data.total_steps} steps</span>
                          )}
                          {event.type === "step_started" && (
                            <span>
                              Step {event.data.step_number}: {event.data.description}
                            </span>
                          )}
                          {event.type === "step_output" && (
                            <span className="truncate block">
                              {event.data.output.substring(0, 100)}...
                            </span>
                          )}
                          {event.type === "verify_pass" && (
                            <span>Step {event.data.step_number} verified successfully</span>
                          )}
                          {event.type === "verify_fail" && (
                            <span>
                              Step {event.data.step_number} verification failed
                            </span>
                          )}
                          {event.type === "run_completed" && (
                            <span>Run completed successfully!</span>
                          )}
                          {event.type === "run_failed" && (
                            <span>Error: {event.data.error}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={eventsEndRef} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Final Output Section */}
          {finalOutput && (
            <Card className="shadow-lg border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Final Output
                  </CardTitle>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>The solution to your problem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {finalOutput}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

export default App;
