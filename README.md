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
- Navigate between cases and their associated tasks.

Caseworkers can view cases owned by colleagues, supporting a collaborative task management workflow.

### Task Creation

Caseworkers can create tasks associated with a case, including cases owned by other caseworkers.

The selected caseworker is recorded as the task creator, independently of the case owner.

The task creation form includes:

- Required title.
- Optional description.
- Required due date and time.

### Task Details and Status Updates

Caseworkers can view individual task details, including:

- Task reference, title and description.
- Due date and time displayed in UK local time.
- Task creator's name.
- Current task status.

Caseworkers can update a task's status to **To do**, **In progress** or **Done**.

The status is displayed as read-only text by default. Selecting **Change** reveals a status dropdown with **Apply** and **Cancel** controls.

Status changes are submitted through an Express route, which validates the requested status and forwards the update to the backend using `PATCH /tasks/{id}`.

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
- Task status updates are restricted to the supported values (TODO, IN_PROGRESS, DONE).

Task creation validation errors are displayed using GOV.UK error summaries and field-level error messages, with previously entered values preserved.

### Date and Time Handling

Task due dates are entered in UK local time (`Europe/London`).

The frontend uses Luxon to convert these values to UTC before submitting them to the backend, which stores timestamps as Java `Instant` values.

UTC timestamps returned by the backend are converted back to UK local time for display.

## Technical Approach

- **Express and TypeScript:** Server-side routing, API integration and form processing.
- **Nunjucks:** Server-rendered HTML templates.
- **GOV.UK Design System:** Consistent, accessible interface components and styling.
- **Axios:** Communication with the backend REST API.
- **Luxon:** Timezone-aware date and time handling.

The frontend communicates with the backend through Express routes rather than making API requests directly from the browser.

### Design Principles

The interface prioritises established GOV.UK Design System components and patterns, simplicity and accessibility.

The implementation favours:

- Clear, predictable navigation and interactions.
- Accessible, descriptive links and form controls.
- Server-rendered HTML and standard form submissions where practical.
- Progressive enhancement, using JavaScript only where it improves the interaction.
- Explicit confirmation before destructive actions.

These principles aim to keep the application understandable, maintainable and usable without introducing unnecessary frontend complexity.

## Assumptions and Limitations

- Caseworker selection simulates a logged-in user and does not provide authentication.
- The selected caseworker is passed between pages using URL query parameters.
- Caseworkers can currently view cases and tasks, create and delete tasks, and update task statuses regardless of case ownership. These actions are not restricted by authentication or authorisation.
- Future due-date validation is currently enforced by the frontend only. The backend should also enforce this rule to ensure consistency across API clients.
- The application uses the `Europe/London` timezone for task due dates.

## Further Development

- Backend enforcement of future due-date restrictions.
- Additional task management business rules, including status transition restrictions.
- Improved error handling for backend API failures.
- Expanded automated frontend tests, including additional validation and error scenarios.
- Potential task proposal and approval workflow, allowing case owners to accept or reject tasks proposed by colleagues.
