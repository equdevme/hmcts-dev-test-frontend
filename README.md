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

### Validation

The frontend validates task creation requests before submitting them to the backend, including:

- Required task title.
- Valid calendar date and 24-hour time.
- Due date and time must be in the future.
- Rejection of nonexistent or ambiguous local times during UK daylight-saving transitions.

Validation errors are displayed using GOV.UK error summaries and field-level error messages, with previously entered values preserved.

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

## Assumptions and Limitations

- Caseworker selection simulates a logged-in user and does not provide authentication.
- The selected caseworker is passed between pages using URL query parameters.
- Caseworkers can currently view and create tasks in any case, regardless of ownership.
- Future due-date validation is currently enforced by the frontend only. The backend should also enforce this rule to ensure consistency across API clients.
- The application uses the `Europe/London` timezone for task due dates.

## Further Development

- Task details, status updates and deletion through the frontend.
- Backend enforcement of future due-date restrictions.
- Additional task management business rules, including status transition restrictions.
- Improved error handling for backend API failures.
- Automated frontend tests.
- Potential task proposal and approval workflow, allowing case owners to accept or reject tasks proposed by colleagues.
