Step 1 — Understand the Problem

Identify this as a refactoring from problem-centric to curriculum-centric.
Define the new hierarchy:
Faculty
Subject
Lab

Step 2 — Design the Domain

Define the model:
Faculty
Subject
Lab
ExecutionProfile
Determine the relationship:
Faculty 1-n Subject
Subject 1-n Lab
Lab 1-1 ExecutionProfile

Step 3 — Design the Backend

Modify the registry or schema.
Create APIs:
GET /faculties
GET /subjects?facultyId=
GET /labs?subjectId=
GET /labs/:id

Step 4 — Design the Frontend

State for:
selectedFaculty
selectedSubject
selectedLab
Cascading reset logic
Load statements/editor/profiles by lab

Step 5 — Migration

Map the old problem to the new lab.
Keep the old execution/grading pipeline.
Only change the metadata. Organization

Step 6 — Code Patch

Edit the following files:

ProblemRegistry.ts → CurriculumRegistry.ts

index.ts
App.tsx

Check where the problem is being read directly.

Step 7 — Validation

Is the faculty changed correctly?

Is the subject filtered correctly?
Is the lab loading the correct editor/starter code?
Is the execution profile going to the correct lab?