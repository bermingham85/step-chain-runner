import { useState, useEffect, useRef } from "react";
import "./App.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Progress } from "./components/ui/progress";
import { Badge } from "./components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Copy, CheckCheck, Play, AlertCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [problem, setProblem] = useState("");
  const [apiKey, setApiKey] = useState(localStorage.getItem("anthropic_api_key") || "");
  const [showApiKey, setShowApiKey] = useState(false);
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

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("anthropic_api_key", apiKey);
    }
  }, [apiKey]);

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
      const headers = {
        "Content-Type": "application/json",
      };
      
      // Only send API key header if provided by user
      if (apiKey.trim()) {
        headers["X-Anthropic-Key"] = apiKey;
      }
      
      const response = await fetch(`${API}/runs`, {
        method: "POST",
        headers: headers,
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
        return "🔗";
      case "step_started":
        return "⛓️";
      case "step_output":
        return "💫";
      case "verify_pass":
        return "✨";
      case "verify_fail":
        return "💥";
      case "run_completed":
        return "🎯";
      case "run_failed":
        return "⚠️";
      default:
        return "🔗";
    }
  };

  const getEventLabel = (type) => {
    const labels = {
      plan_created: "Chain Forged",
      step_started: "Link Activated",
      step_output: "Data Flowing",
      verify_pass: "Link Verified",
      verify_fail: "Link Broken",
      run_completed: "Chain Complete",
      run_failed: "Chain Failed",
    };
    return labels[type] || type;
  };

  return (
    <div className="App min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3">
            ⛓️ Step-Chain Runner
          </h1>
          <p className="text-xl" style={{ color: '#a0a0a0', textShadow: '0 0 10px rgba(255,107,53,0.3)' }}>
            AI-powered problem solver • Powered by LangChain
          </p>
        </div>

        {/* API Key Input */}
        <Card className="card mb-6 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔑</span> API Configuration (Optional)
            </CardTitle>
            <CardDescription style={{ color: '#b0b0b0' }}>
              Enter your Anthropic Claude API key (or leave blank to use server default)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full p-3 rounded-lg font-mono text-sm"
                  disabled={isRunning}
                  style={{
                    background: 'rgba(10, 14, 39, 0.8)',
                    border: '2px solid transparent',
                    borderImage: 'linear-gradient(135deg, var(--chain-orange), var(--chain-blue)) 1',
                    color: '#e0e0e0'
                  }}
                />
              </div>
              <Button
                onClick={() => setShowApiKey(!showApiKey)}
                variant="outline"
                size="lg"
                style={{
                  background: 'rgba(75, 207, 250, 0.2)',
                  borderColor: '#4bcffa',
                  color: '#4bcffa'
                }}
              >
                {showApiKey ? "Hide" : "Show"}
              </Button>
            </div>
            <p className="text-xs mt-2" style={{ color: '#888' }}>
              Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#4bcffa', textDecoration: 'underline' }}>console.anthropic.com</a>
            </p>
          </CardContent>
        </Card>

        {/* Problem Input Section */}
        <Card className="card mb-6 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔗</span> Problem Input
            </CardTitle>
            <CardDescription style={{ color: '#b0b0b0' }}>
              Describe the problem you want to solve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Describe the problem you want to solve..."
              className="w-full min-h-[120px] p-4 rounded-lg resize-y font-mono"
              disabled={isRunning}
              style={{ fontSize: '15px' }}
            />
            <Button
              onClick={handleRun}
              disabled={isRunning || !problem.trim()}
              className="mt-4 w-full md:w-auto text-white font-bold"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Forging Chain...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Forge Chain
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        {runStatus && (
          <Card className="card mb-6 shadow-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={runStatus.status === "completed" ? "success" : "default"}
                    data-state={runStatus.status}
                  >
                    ⛓️ {runStatus.status.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-semibold" style={{ color: '#ffa502' }}>
                    Link {runStatus.current_step_index} of {runStatus.total_steps}
                  </span>
                </div>
                <span className="text-lg font-bold" style={{ color: '#4bcffa' }}>
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
                className="h-3"
              />
            </CardContent>
          </Card>
        )}

        {/* Current Step Panel */}
        {currentStep && (
          <Card className="card current-step-panel mb-6 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>⛓️</span> Link {currentStep.step_number}
                </CardTitle>
                {currentStep.verification && (
                  <div className="flex items-center gap-1">
                    {currentStep.verification === "pass" ? (
                      <CheckCircle2 className="h-6 w-6" style={{ color: '#26de81' }} />
                    ) : (
                      <XCircle className="h-6 w-6" style={{ color: '#ff4757' }} />
                    )}
                  </div>
                )}
              </div>
              <CardDescription style={{ color: '#b0b0b0' }}>
                {currentStep.description}
              </CardDescription>
            </CardHeader>
            {currentStep.output && (
              <CardContent>
                <div className="p-4 rounded-md" style={{ 
                  background: 'rgba(10, 14, 39, 0.6)',
                  border: '1px solid rgba(75, 207, 250, 0.3)'
                }}>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: '#d0d0d0' }}>
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
            <Card className="card shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📡</span> Live Chain Events
                </CardTitle>
                <CardDescription style={{ color: '#b0b0b0' }}>
                  Real-time updates from execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto space-y-3">
                  {events.map((event, index) => (
                    <div
                      key={index}
                      className="event-log-item flex gap-3 p-3 rounded-md"
                    >
                      <div className="text-2xl flex-shrink-0">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm" style={{ color: '#ffa502' }}>
                            {getEventLabel(event.type)}
                          </span>
                          <span className="text-xs" style={{ color: '#888' }}>
                            {formatTimestamp(event.ts)}
                          </span>
                        </div>
                        <div className="text-sm" style={{ color: '#c0c0c0' }}>
                          {event.type === "plan_created" && (
                            <span>Forged chain with {event.data.total_steps} links</span>
                          )}
                          {event.type === "step_started" && (
                            <span>
                              Link {event.data.step_number}: {event.data.description}
                            </span>
                          )}
                          {event.type === "step_output" && (
                            <span className="truncate block">
                              {event.data.output.substring(0, 100)}...
                            </span>
                          )}
                          {event.type === "verify_pass" && (
                            <span>Link {event.data.step_number} verified successfully</span>
                          )}
                          {event.type === "verify_fail" && (
                            <span>
                              Link {event.data.step_number} verification failed
                            </span>
                          )}
                          {event.type === "run_completed" && (
                            <span>Chain completed successfully!</span>
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
            <Card className="card final-output-card shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" style={{ color: '#26de81' }} />
                    <span>Chain Complete</span>
                  </CardTitle>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    style={{
                      background: 'rgba(38, 222, 129, 0.2)',
                      borderColor: '#26de81',
                      color: '#26de81'
                    }}
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
                <CardDescription style={{ color: '#b0b0b0' }}>
                  The solution to your problem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-md" style={{
                  background: 'rgba(15, 30, 20, 0.6)',
                  border: '2px solid rgba(38, 222, 129, 0.3)'
                }}>
                  <p className="whitespace-pre-wrap leading-relaxed" style={{ color: '#e0e0e0' }}>
                    {finalOutput}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="alert mt-6">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription style={{ color: '#ffcccc' }}>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

export default App;
