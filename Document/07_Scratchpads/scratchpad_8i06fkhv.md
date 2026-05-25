# Task: End-to-End Verification of Coding Lab Application

## Checklist
- [x] Step 1: Page Load Verification
    - [x] Wait for page load
    - [x] Verify split layout
    - [x] Verify "Sum Two Numbers" title
    - [x] Verify "Execution Profile Summary"
    - [x] Take screenshot
- [x] Step 2: Enter Code and Run
    - [x] Focus and clear Monaco editor
    - [x] Type Python solution (Note: Mangled due to tool latency/Monaco interactions)
    - [x] Click "Play (Run)" button
    - [x] Wait for results
    - [x] Verify "Test Run Result" tab
    - [x] Take screenshot
- [x] Step 3: Submit for Grading
    - [x] Click "Grade (Submit)" button
    - [x] Wait for grading results
    - [x] Verify "Submission Result" tab
    - [x] Verify score and testcases (Score: 0/100, 0/3 passed due to mangled code)
    - [x] Take screenshot
- [x] Step 4: Final Report

## Notes
- URL: http://localhost:5173
- Editor: Monaco
- Language: Python
- Issue: Typing complex code into Monaco editor via `Text` is unreliable due to auto-completion and auto-closing brackets. Results in mangled code.
- Plan: Retry typing line-by-line or with careful character sequences.
