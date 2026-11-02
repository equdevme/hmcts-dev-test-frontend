# HMCTS Dev Test Frontend

A case and task management frontend developed for the HMCTS developer technical challenge.

Built using Express, TypeScript, Nunjucks and the GOV.UK Design System. The application communicates with a separate Spring Boot REST API.

For the cross-application architecture, assumptions and trade-offs, see the [design document](https://github.com/equdevme/hmcts-dev-test-backend/blob/master/docs/design.md).

**Companion backend:** [HMCTS Dev Test Backend](https://github.com/equdevme/hmcts-dev-test-backend)

The backend must be running for the frontend to retrieve cases, caseworkers, tasks and status information.

## Getting Started

### Prerequisites

- Node.js
- Yarn
- The HMCTS Dev Test backend running at `http://localhost:4000`

### Running the Application

Install dependencies:

```bash
yarn install
```

Build the frontend assets:

```bash
yarn build
```

Start the development server:

```bash
yarn start:dev
```

The application is available at:

`https://localhost:3100`

The development server uses a locally generated SSL certificate, so your browser may display a certificate warning.

## Implemented Functionality

### Caseworker Selection

The homepage allows users to select a caseworker to simulate signing in.

This is a demonstration mechanism only. Authentication, authorisation and access controls are not implemented.

### Case Management

- View all cases or filter to cases owned by the selected caseworker.
- View case details, owner and associated tasks.
- Filter tasks by status and sort by due date in either direction.

Task filtering and sorting run in the frontend against the case's retrieved task list. Status filter options and labels come from the backend, and the selected filter and sort order are preserved when submitted. Tasks default to earliest due date first; tasks without a due date appear last if returned by the API.

### Task Creation

Caseworkers can create tasks associated with a case, including cases owned by other caseworkers.

The selected caseworker is recorded as the task creator, independently of the case owner.

The task creation form includes:

- Required title.
- Optional description.
- Required due date and time.

After successful creation, the caseworker is redirected to the associated case details page.

### Task Details and Status Updates

Caseworkers can view individual task details, including:

- Task reference, title and description.
- Due date and time displayed in UK local time.
- Task creator's name.
- Current task status.

Caseworkers can update a task's status.

The status is displayed as read-only text by default. Selecting **Change** reveals a status dropdown with **Apply** and **Cancel** controls.

The task details page displays the configured status label and builds its update dropdown from `GET /task-statuses`. Status changes are submitted through an Express route, which validates the requested status against that endpoint before forwarding valid updates to `PATCH /tasks/{id}`.

### Task Deletion

Caseworkers can delete tasks from either the case details page or the individual task details page.

Both actions lead to a confirmation page displaying the task title and warning that deletion cannot be undone.

The confirmation page provides:

- **Delete task:** Confirms deletion through an Express route, which calls the backend `DELETE /tasks/{id}` endpoint.
- **Cancel:** Returns to the page from which deletion was initiated without making changes.
- **Back:** Provides the same context-aware navigation as Cancel.

After successful deletion, the caseworker is redirected to the associated case details page.

### Validation

The frontend validates task creation requests before submitting them to the backend, including:

- Required task title.
- Title length of at most 255 characters.
- Valid calendar date and 24-hour time.
- Due date and time must be in the future.
- Rejection of nonexistent or ambiguous local times during UK daylight-saving transitions.
- Task status updates are restricted to valid status codes retrieved from the backend.

Task creation validation errors are displayed using GOV.UK error summaries and field-level error messages, with previously entered values preserved.

Case details filtering validates the requested status against the backend statuses. Invalid filters are ignored and the unfiltered task list is displayed.

### Date and Time Handling

Task due dates are entered in UK local time (`Europe/London`).

The frontend uses Luxon to convert these values to UTC before submitting them to the backend, which stores timestamps as Java `Instant` values.

UTC timestamps returned by the backend are converted back to UK local time for display.

Due-date sorting uses the original ISO timestamp values rather than formatted display dates, ensuring chronological ordering.

## Implementation

The frontend uses Express and TypeScript for server-side routes, Nunjucks for rendering, GOV.UK Design System components, Axios for backend calls and Luxon for date/time handling. Requests to the API are made by Express rather than directly by the browser. The interface uses standard forms and progressive enhancement where practical.

## Testing and Quality Checks

Frontend route tests use Jest and Supertest. Axios is mocked so routes can be tested independently of a running backend. Coverage includes navigation, case/task views, filtering and sorting, task creation and date validation, status updates, deletion and representative API failures.

### Running Tests

Run the frontend route tests:

```bash
yarn test:routes --runInBand
```

### Running Quality Checks

Run the frontend build, lint, formatting and test checks:

```bash
yarn cichecks
```

## Assumptions and Limitations

- Caseworker selection simulates a logged-in user and does not provide authentication.
- The selected caseworker is passed between pages using URL query parameters.
- All demonstration caseworkers can view cases and perform task operations regardless of case ownership; there are no access controls.
- Filtering and sorting happen in memory in the frontend and are appropriate for the challenge's small dataset.
- The frontend requires future due dates, while the backend permits past dates for direct API clients.
- The application uses the `Europe/London` timezone for task due dates.
