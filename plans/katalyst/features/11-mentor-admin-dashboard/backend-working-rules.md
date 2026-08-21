# Task: Implement Admin Backend + API Contracts

You are working inside the existing repository:

`https://github.com/Mastercard-Code-for-Change-3-0/Team-4/tree/main`

I am responsible for the **Admin backend and Admin API contracts**.

## IMPORTANT — READ BEFORE CODING

First inspect the COMPLETE existing repository.

Do NOT immediately create new files or change the database schema.

Understand and report:

1. Existing backend framework and language
2. Existing folder structure
3. Existing API structure
4. Existing authentication / Better Auth setup
5. Existing database setup
6. Existing ORM/database client
7. Existing models/schema
8. Existing controllers/services/routes pattern
9. Existing middleware
10. Existing validation library
11. Existing error-handling pattern
12. Existing response format
13. Existing naming conventions
14. Existing frontend expectations if relevant
15. Existing modules/enrollments/submissions implementation

Do NOT replace or refactor the existing architecture unless absolutely necessary.

Reuse the project's existing patterns.

---

# MY RESPONSIBILITY

I am Person C / Admin-backend developer.

For this task, focus on the **Admin side of the system**.

The Admin is responsible for creating and managing the learning structure that students will later use.

The important business flow is:

Admin
→ Module
→ Task
→ Task contains XP + evaluation criteria + task-related data
→ Student enrolls
→ Student submits task
→ Evaluation service/LLM evaluates submission
→ Score + feedback generated
→ predefined Task XP awarded

The Admin does NOT decide the student's final marks manually in the normal flow.

The Admin defines the task and its evaluation configuration.

---

# VERY IMPORTANT: SCHEMA WILL BE PROVIDED AFTER THIS PROMPT

I will provide the final database schema separately after you inspect the repository.

Until I provide that schema:

* DO NOT invent database fields
* DO NOT create a new schema
* DO NOT modify existing database schema
* DO NOT guess relationships
* DO NOT create migrations based on assumptions
* DO NOT duplicate existing models
* DO NOT create alternate versions of existing entities

First inspect the repository and identify exactly where the Admin functionality should fit.

After inspection, tell me:

* what files you found
* what existing architecture you will follow
* what files you propose to create/change
* what information is still dependent on the schema I will provide

Then WAIT for the schema.

---

# ADMIN API CONTRACTS

After the schema is provided, implement these contracts using the repository's existing conventions.

## 1. Module Management

### Create Module

`POST /modules`

Purpose:

Admin creates a learning module/course.

The request should contain only fields supported by the final schema.

Expected conceptual structure:

```json
{
  "title": "...",
  "description": "...",
  "difficulty": "...",
  "duration": 30
}
```

Do not assume these exact fields exist. Map them to the final schema I provide.

---

### Get All Modules

`GET /modules`

Admin should be able to retrieve modules.

Support existing project conventions for:

* pagination
* filtering
* sorting

ONLY if the project already uses them or the final schema requires them.

---

### Get Module

`GET /modules/:moduleId`

Return the complete module information required by the Admin UI.

---

### Update Module

`PUT /modules/:moduleId`

Admin can update an existing module.

Use the project's existing update/validation convention.

---

# 2. Task Management

Tasks are the most important Admin entity because they are consumed later by the submission/evaluation system.

The conceptual relationship is:

Module
→ Tasks
→ Student Submission
→ Evaluation
→ Score + XP

---

## Create Task

`POST /modules/:moduleId/tasks`

Conceptually the task contains:

```text
title
description
XP
maximum marks
evaluation criteria
task-related/reference data
```

Example conceptual payload:

```json
{
  "title": "Explain ACID Properties",
  "description": "Explain all four ACID properties with examples.",
  "xp": 50,
  "maxMarks": 100,
  "evaluationCriteria": [
    {
      "name": "Understanding",
      "description": "Correct understanding of ACID properties",
      "weight": 40
    },
    {
      "name": "Examples",
      "description": "Quality of examples",
      "weight": 30
    },
    {
      "name": "Clarity",
      "description": "Clarity of explanation",
      "weight": 30
    }
  ],
  "taskData": {
    "topic": "DBMS",
    "difficulty": "medium"
  }
}
```

IMPORTANT:

This is only the conceptual contract.

Once I provide the actual schema, use the schema's exact field names and relationships.

Do not blindly copy this JSON into the implementation.

---

## Get Module Tasks

`GET /modules/:moduleId/tasks`

Return tasks belonging to the module.

---

## Get Task

`GET /tasks/:taskId`

Return the task details required by:

* Admin
* Student flow
* future evaluation service

The response should contain whatever fields the final schema defines for:

* task description
* XP
* maximum marks
* evaluation criteria
* task-related data/reference data
* module relationship
* status

Do not expose sensitive/internal fields unnecessarily.

---

## Update Task

`PUT /tasks/:taskId`

Admin can update task configuration.

Important:

If the task already has student submissions/evaluations, be careful about changing fields that could invalidate historical evaluations.

Follow the final schema and existing project conventions.

---

## Change Task Status

Prefer status-based deactivation over hard deletion if the existing architecture supports it.

Conceptually:

`PATCH /tasks/:taskId/status`

Example:

```json
{
  "status": "inactive"
}
```

Do not hard-delete historical task data if it is referenced by submissions/evaluations.

---

# 3. Admin Student Management

Implement only what is supported by the existing architecture/schema.

### Get Students

`GET /admin/students`

Admin should be able to see students.

If the existing project already supports filtering/pagination, expose useful filters.

Possible conceptual filters:

```text
status
module
search
```

Do not invent unsupported relationships.

---

# 4. Admin Performance View

The Admin needs visibility into student performance.

Conceptually:

`GET /admin/students/:userId/performance`

This should aggregate existing data from the system such as:

```text
student
enrollments
tasks
submissions
scores
XP
```

BUT:

Do not implement this by duplicating data.

Use the actual relationships from the final schema.

If the score/submission APIs are owned by another team member, preserve clean boundaries and reuse their service/repository layer where appropriate.

---

# 5. Admin Evaluation Monitoring

Conceptually:

`GET /admin/evaluations`

Purpose:

Allow Admin to monitor evaluations performed by the scoring/AI system.

Possible information:

```text
submissionId
studentId
taskId
score
XP awarded
evaluation status
feedback
evaluation timestamp
```

Again, use only fields that actually exist in the final schema.

---

# IMPORTANT BUSINESS RULE

The Admin creates the task.

For example:

```text
Task
 ├── XP = 50
 ├── maxMarks = 100
 ├── evaluation criteria
 └── task data
```

The student later submits the task.

The evaluation service/Person C does:

```text
Task
+
Evaluation Criteria
+
Task Data
+
Student Submission
        ↓
       LLM
        ↓
Marks + Feedback
        ↓
Task's predefined XP awarded
```

Therefore:

### Admin owns

```text
Module creation
Task creation
Task XP
Task maximum marks
Evaluation criteria
Task-related/reference data
Task lifecycle/status
```

### Student flow owns

```text
Enrollment
Submission
Submission status
```

### Scoring/AI owns

```text
Evaluation
Marks
Feedback
XP awarding
AI interactions
```

Do not mix these responsibilities.

---

# API CONTRACT REQUIREMENTS

For every endpoint, implement:

1. HTTP method
2. Route
3. Request validation
4. Authentication
5. Authorization
6. Controller/handler
7. Service/business logic
8. Database access using the project's existing pattern
9. Proper success response
10. Proper error response
11. Correct HTTP status codes

Follow the repository's existing architecture instead of introducing a new pattern.

---

# AUTHORIZATION

Admin endpoints must be protected.

Use the existing Better Auth/authentication implementation.

Do NOT create a second authentication system.

Do NOT hardcode an admin user.

Do NOT trust `role: admin` from an arbitrary request body.

Use the authenticated user's session/context and the project's existing authorization mechanism.

If role/permission handling is not yet implemented, identify the correct integration point and report it before inventing a new auth system.

---

# VALIDATION

Use the project's existing validation library/pattern.

Validate:

* required fields
* string lengths
* numeric ranges
* XP validity
* maximum marks validity
* evaluation criteria
* weights if applicable
* module/task relationships

Important business validation:

If evaluation criteria use weights, make sure their total follows the project's agreed rule.

Do not silently normalize invalid values unless the project explicitly requires it.

---

# ERROR HANDLING

Use the existing project's error-handling mechanism.

At minimum handle:

```text
400 — invalid request
401 — unauthenticated
403 — authenticated but not authorized
404 — module/task/student not found
409 — conflict
500 — unexpected server error
```

Do not expose stack traces or sensitive database details in API responses.

---

# RESPONSE FORMAT

Follow the repository's existing response format.

Do NOT introduce a new response wrapper if the project already has one.

If there is no established convention, use a consistent structure such as:

Success:

```json
{
  "data": {}
}
```

Error:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Task not found"
  }
}
```

But only use this if the repository does not already define another format.

---

# TESTING

After implementation, create/update tests according to the repository's existing testing setup.

At minimum test:

### Modules

* create module
* get modules
* get module
* update module
* invalid module data
* unauthorized access

### Tasks

* create task
* get tasks
* get task
* update task
* deactivate task
* invalid XP
* invalid evaluation criteria
* nonexistent module
* nonexistent task
* unauthorized access

### Admin

* admin can access admin endpoints
* non-admin cannot access admin endpoints

Do not break existing tests.

Run the project's existing test/lint/typecheck commands.

---

# INTEGRATION SAFETY

Other team members are implementing:

Person A:

* users
* modules/foundation

Person B:

* enrollments
* submissions

Person C:

* scoring
* AI interactions

My current responsibility is specifically the **Admin backend and contracts**.

Therefore:

* Do not overwrite Person B's submission implementation.
* Do not implement Person C's LLM evaluation engine unless required by the existing codebase.
* Do not redesign Better Auth.
* Do not replace existing database architecture.
* Do not modify unrelated modules.
* Keep changes isolated and easy to merge.

---

# IMPLEMENTATION PROCESS

Follow this exact process:

### STEP 1

Inspect the complete repository.

### STEP 2

Explain the existing architecture and identify where Admin functionality belongs.

### STEP 3

Wait for me to provide the final database schema.

### STEP 4

After I provide the schema, map:

```text
Schema
  ↓
Admin entities
  ↓
API contracts
  ↓
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories/DB
  ↓
Validation
```

### STEP 5

Implement the Admin backend.

### STEP 6

Generate/update API documentation if the repository already uses OpenAPI/Swagger or another API documentation system.

### STEP 7

Run tests, type checks and linting.

### STEP 8

Give me a final report containing:

```text
Files created
Files modified
Endpoints implemented
Request schemas
Response schemas
Authentication/authorization behavior
Tests added
Commands executed
Any remaining issues
```

---

# CRITICAL RULE

Do not guess the database schema.

Do not create migrations until I provide the schema.

Do not assume field names.

Do not assume table/collection names.

Do not assume ORM.

First inspect the repository.

Then wait for my schema.

Once I provide the schema, implement the Admin contracts exactly against it while preserving the existing architecture.
