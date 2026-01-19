# Frontend UI Rebuild Task - Version 2

## ⚠️ CRITICAL: READ THIS FIRST

### **DO NOT Change These Things:**

❌ **DO NOT** replace or modify `frontend/package.json` - it already has Next.js 14  
❌ **DO NOT** convert to Create React App or any other framework  
❌ **DO NOT** add `react-scripts` or remove Next.js  
❌ **DO NOT** modify any backend files  
❌ **DO NOT** change `docker-compose.yml`  
❌ **DO NOT** create new directories outside `frontend/app/`  
❌ **DO NOT** use the word "orchestration" anywhere  

### **DO ONLY This:**

✅ **ONLY** modify files inside `frontend/app/` directory  
✅ **ONLY** edit `frontend/app/page.tsx` to rebuild the UI  
✅ **ONLY** add new component files in `frontend/app/components/` if needed  
✅ **ONLY** update `frontend/app/globals.css` for custom styles  
✅ **KEEP** everything as Next.js 14 with App Router  
✅ **KEEP** TypeScript  
✅ **KEEP** Tailwind CSS  

---

## ⚠️ DEFINITION OF DONE - Must Complete All 12 Items

**You are DONE when ALL 12 items work perfectly:**

1. ✅ User can enter a problem in textarea and click "Run" button
2. ✅ POST /api/runs successfully creates run and receives `run_id`
3. ✅ SSE connection at /api/runs/{run_id}/events receives events in real-time
4. ✅ Progress bar shows and updates: `current_step_index / total_steps`
5. ✅ Current step panel displays: step number, description, output, verification status
6. ✅ Live event log displays all events with formatted timestamps (HH:MM:SS)
7. ✅ Final output appears in dedicated green-bordered section when complete
8. ✅ Copy to clipboard button works and shows success feedback
9. ✅ Errors display prominently with red styling if run fails
10. ✅ UI is responsive on mobile (< 768px) and desktop
11. ✅ Docker build works: `docker-compose up --build` runs without errors
12. ✅ Complete flow works: input problem → run → events → final output

**Test with:** "How do I make chocolate chip cookies?"

---

## Current Setup (DO NOT CHANGE)

### **Frontend is Already Next.js 14:**
```json
// frontend/package.json (line 12)
"next": "14.1.0"
```

### **Directory Structure (Keep This):**
```
frontend/
├── app/
│   ├── page.tsx      ← EDIT THIS FILE
│   ├── layout.tsx    ← Can edit if needed
│   ├── globals.css   ← Can add styles here
│   └── components/   ← Create components here (optional)
├── package.json      ← DO NOT EDIT
├── tsconfig.json     ← DO NOT EDIT
└── Dockerfile        ← DO NOT EDIT
```

---

## Your Task: Rebuild UI in page.tsx

Open `frontend/app/page.tsx` and rebuild it with these 6 sections:

### 1. Problem Input Section
```typescript
// Large textarea (min 120px height)
<textarea
  className="w-full h-32 p-3 border rounded-lg"
  placeholder="Describe the problem you want to solve..."
  value={problem}
  onChange={(e) => setProblem(e.target.value)}
  disabled={loading}
/>

// Run button
<button
  onClick={handleSubmit}
  disabled={loading}
  className="px-6 py-3 bg-blue-600 text-white rounded-lg"
>
  {loading ? 'Running...' : 'Run'}
</button>
```

### 2. Real-time Progress Indicator
```typescript
// Show when run is active
{runStatus && (
  <div className="flex items-center gap-4">
    <div className="flex-1 bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-600 h-2 rounded-full"
        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
      />
    </div>
    <span>{currentStep} / {totalSteps}</span>
    <span className="text-sm">{runStatus}</span>
  </div>
)}
```

### 3. Current Step Panel
```typescript
// Show currently executing step
{currentStep && (
  <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
    <h3 className="font-semibold">Step {currentStep.number} of {totalSteps}</h3>
    <p className="text-gray-700">{currentStep.description}</p>
    {currentStep.output && <p className="mt-2">{currentStep.output}</p>}
    {currentStep.verified && (
      <span className="text-green-600">✓ Verified</span>
    )}
  </div>
)}
```

### 4. Live Event Log
```typescript
// Scrollable feed with all events
<div className="max-h-96 overflow-y-auto space-y-2">
  {events.map((event, index) => (
    <div key={index} className="p-3 bg-gray-50 border rounded">
      <div className="flex justify-between">
        <span className="font-medium">{event.type}</span>
        <span className="text-xs text-gray-500">
          {new Date(event.ts).toLocaleTimeString()}
        </span>
      </div>
      <div className="text-sm mt-1">
        {/* Format event.data nicely - NOT raw JSON */}
        {formatEventData(event)}
      </div>
    </div>
  ))}
</div>
```

### 5. Final Output Section
```typescript
// Show when run completes
{finalOutput && (
  <div className="border-2 border-green-500 bg-green-50 p-4 rounded-lg">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-green-900">✓ Final Output</h3>
        <p className="mt-2 text-gray-800">{finalOutput}</p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(finalOutput)
          // Show "Copied!" feedback
        }}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Copy
      </button>
    </div>
  </div>
)}
```

### 6. Error Handling
```typescript
// Show if run fails
{error && (
  <div className="border-2 border-red-500 bg-red-50 p-4 rounded-lg">
    <h3 className="font-semibold text-red-900">⚠ Error</h3>
    <p className="mt-2 text-red-800">{error}</p>
  </div>
)}
```

---

## API Integration (Already in Code - Just Use It)

### Connect to Backend APIs:

```typescript
'use client'
import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// 1. Create run
const response = await fetch(`${API_URL}/api/runs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ problem })
})
const { run_id } = await response.json()

// 2. Connect to SSE
const eventSource = new EventSource(`${API_URL}/api/runs/${run_id}/events`)

eventSource.onmessage = (event) => {
  const eventData = JSON.parse(event.data)
  // Handle event based on type:
  // - plan_created: Set totalSteps from data.total_steps
  // - step_started: Update currentStep from data.step_number
  // - step_output: Add to currentStep.output
  // - verify_pass: Mark currentStep.verified = true
  // - run_completed: Set finalOutput from data.final_output
  // - run_failed: Set error from data.error
}

eventSource.onerror = () => {
  eventSource.close()
}
```

---

## Event Types You'll Receive

| Event Type | Data Structure | What to Do |
|------------|---------------|------------|
| `plan_created` | `{ plan: [...], total_steps: 4 }` | Set totalSteps to 4 |
| `step_started` | `{ step_number: 2, description: "..." }` | Update current step panel |
| `step_output` | `{ step_number: 2, output: "..." }` | Display output in current step |
| `verify_pass` | `{ step_number: 2 }` | Show checkmark on step |
| `verify_fail` | `{ step_number: 2, reason: "..." }` | Show X on step |
| `run_completed` | `{ final_output: "..." }` | Display in final output section |
| `run_failed` | `{ error: "..." }` | Display in error section |

---

## Styling Guidelines

- **Colors:** Blue primary (#3B82F6), gray neutrals, green success (#10B981), red error (#EF4444)
- **Spacing:** Use Tailwind: `p-4`, `mb-6`, `gap-4`, etc.
- **Typography:** `text-3xl font-bold` for titles, `text-sm` for metadata
- **Responsive:** Use `sm:`, `md:`, `lg:` breakpoints
- **Animations:** Add `transition-all duration-200` for smooth changes

---

## Testing Checklist

Before pushing, verify:

```bash
# 1. Build works
cd frontend
npm install  # Should NOT change package.json
npm run build

# 2. Docker works
docker-compose up --build

# 3. Test flow
- Open http://localhost:3000
- Enter: "How do I make chocolate chip cookies?"
- Click "Run"
- Watch events stream
- Verify progress bar updates
- Check final output appears
- Test copy button
```

---

## Common Mistakes to Avoid

❌ **Mistake:** Replacing Next.js with Create React App  
✅ **Correct:** Keep Next.js 14, only edit files in `frontend/app/`

❌ **Mistake:** Using `react-scripts` commands  
✅ **Correct:** Use Next.js commands: `npm run dev`, `npm run build`

❌ **Mistake:** Importing from 'next/router'  
✅ **Correct:** Next.js App Router doesn't need router import

❌ **Mistake:** Creating `src/` directory  
✅ **Correct:** Everything goes in `app/` directory

❌ **Mistake:** Showing raw JSON in event log  
✅ **Correct:** Format event data nicely with readable text

---

## When You're Done

1. Verify all 12 Definition of Done items work
2. Test with `docker-compose up --build`
3. Commit with message:
```bash
git add frontend/app/
git commit -m "Rebuild frontend UI in Next.js 14

- Add progress indicator with real-time updates
- Add current step panel with verification status
- Add live event log with formatted timestamps
- Add final output section with copy button
- Add error handling with red styling
- Keep Next.js 14 framework (no CRA)
- All 12 Definition of Done items verified

Co-Authored-By: Emergent <emergent@ai.dev>"
```
4. Push to master branch

---

## Summary

**What you're doing:** Rebuilding the UI in `frontend/app/page.tsx` to show all 6 sections

**What you're NOT doing:** Changing frameworks, modifying backend, or touching package.json

**Framework:** Next.js 14 with App Router (already configured - keep it!)

**Definition of Done:** All 12 items work perfectly

**Test problem:** "How do I make chocolate chip cookies?"

Now go rebuild that UI! 🚀
