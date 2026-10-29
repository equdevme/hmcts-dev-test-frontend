# HMCTS Dev Test Frontend

A case and task management frontend developed for the HMCTS developer technical challenge.

Built using Express, TypeScript, Nunjucks and the GOV.UK Design System. The application communicates with a separate Spring Boot REST API.

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
yarn webpack
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
- View case details, including the case owner and description.
- View tasks associated with a case.
- Filter tasks within a case by their current status.
- Sort tasks by due date, either earliest or latest first.
- Combine status filtering and due-date sorting.
- Navigate between cases and their associated tasks.

Caseworkers can view cases owned by colleagues, supporting a collaborative task management workflow.

Task filtering and sorting are performed by the frontend using task data retrieved from the backend.

Available status filters are retrieved dynamically from the backend rather than hardcoded into the interface. The selected filter and sort order are preserved when the form is submitted.

Tasks are sorted by due date in ascending order by default. Tasks without a due date, if encountered, are placed last.

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

Caseworkers can update a task's status using the available statuses provided by the backend.

The status is displayed as read-only text by default. Selecting **Change** reveals a status dropdown with **Apply** and **Cancel** controls.

Status changes are submitted through an Express route, which validates the requested status against the statuses retrieved from `GET /task-statuses` and forwards valid updates to the backend using `PATCH /tasks/{id}`.

Task statuses are maintained as reference data in the backend database. The frontend retrieves the available status codes and human-readable labels through the API, avoiding duplication of status definitions between the frontend and backend.

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
- Valid calendar date and 24-hour time.
- Due date and time must be in the future.
- Rejection of nonexistent or ambiguous local times during UK daylight-saving transitions.
- Task status updates are restricted to valid status codes retrieved from the backend.

Task creation validation errors are displayed using GOV.UK error summaries and field-level error messages, with previously entered values preserved.

Case details filtering also validates the requested status against the available backend statuses. Invalid status filters are ignored, and the unfiltered task list is displayed.

### Date and Time Handling

Task due dates are entered in UK local time (`Europe/London`).

The frontend uses Luxon to convert these values to UTC before submitting them to the backend, which stores timestamps as Java `Instant` values.

UTC timestamps returned by the backend are converted back to UK local time for display.

Due-date sorting uses the original ISO timestamp values rather than formatted display dates, ensuring chronological ordering.

## Technical Approach

- **Express and TypeScript:** Server-side routing, API integration and form processing.
- **Nunjucks:** Server-rendered HTML templates.
- **GOV.UK Design System:** Consistent, accessible interface components and styling.
- **Axios:** Communication with the backend REST API.
- **Luxon:** Timezone-aware date and time handling.
- **Jest and Supertest:** Automated tests for frontend routes and HTTP responses.

The frontend communicates with the backend through Express routes rather than making API requests directly from the browser.

Backend API responses are used to populate caseworker information, case and task details, and task status reference data.

### Design Principles

The interface prioritises established GOV.UK Design System components and patterns, simplicity and accessibility.

The implementation favours:

- Clear, predictable navigation and interactions.
- Accessible, descriptive links and form controls.
- Server-rendered HTML and standard form submissions where practical.
- Progressive enhancement, using JavaScript only where it improves the interaction.
- Explicit confirmation before destructive actions.
- Reusing backend reference data rather than duplicating business definitions in the frontend.
- Keeping presentation and interaction logic separate from backend data persistence.

These principles aim to keep the application understandable, maintainable and usable without introducing unnecessary frontend complexity.

## Testing and Quality Checks

Frontend route tests use Jest and Supertest to verify application behaviour.

Axios requests are mocked so the frontend routes can be tested independently of the running backend and database.

The tests cover:

- Displaying cases and their owners.
- Filtering cases by the selected caseworker.
- Displaying case details and associated tasks.
- Filtering tasks by status, including invalid filters and empty results.
- Sorting tasks by due date in ascending and descending order.
- Combining status filtering and due-date sorting.
- Task creation and input validation.
- Displaying task details.
- Updating task statuses and rejecting invalid values.
- Task deletion and confirmation-page navigation.

The mocked API responses include task status reference data, allowing tests to verify how the frontend handles statuses supplied by the backend.

### Running Tests

Run the frontend route tests:

```bash
yarn test:routes --runInBand
```

### Running Quality Checks

Run the project's full frontend checks:

```bash
yarn cichecks
```

These checks include frontend asset compilation, linting, formatting validation and automated tests.

The project uses ESLint and Prettier to maintain consistent code quality and formatting.

## Assumptions and Limitations

- Caseworker selection simulates a logged-in user and does not provide authentication.
- The selected caseworker is passed between pages using URL query parameters.
- Caseworkers can currently view cases and tasks, create and delete tasks, and update task statuses regardless of case ownership. These actions are not restricted by authentication or authorisation.
- Task filtering and sorting are performed in memory by the frontend after retrieving the case's tasks. This is suitable for the current challenge scope, but larger datasets may benefit from backend filtering, sorting and pagination.
- Future due-date validation is currently enforced by the frontend only. The backend should also enforce this rule to ensure consistency across API clients.
- The application uses the `Europe/London` timezone for task due dates.
- Task status options are retrieved from the backend, which is the source of truth for available statuses.

## Further Development

- Backend enforcement of future due-date restrictions.
- Additional task management business rules, including status transition restrictions.
- Improved error handling for backend API failures.
- Expanded automated frontend tests, including additional validation, date-handling and error scenarios.
- Backend filtering, sorting and pagination for larger task collections.
- Authentication and authorisation to replace the simulated caseworker selection.
- Potential task proposal and approval workflow, allowing case owners to accept or reject tasks proposed by colleagues.
