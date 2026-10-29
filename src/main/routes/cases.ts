import axios from 'axios';
import { Application } from 'express';
import { DateTime } from 'luxon';

export default function (app: Application): void {
  app.get('/cases', async (req, res, next) => {
    try {
      const caseworkerId = Number(req.query.caseworkerId);
      const view = req.query.view === 'mine' ? 'mine' : 'all';

      if (!Number.isSafeInteger(caseworkerId) || caseworkerId <= 0) {
        return res.redirect('/');
      }

      const [caseworkersResponse, casesResponse] = await Promise.all([
        axios.get('http://localhost:4000/caseworkers'),
        axios.get('http://localhost:4000/cases', {
          params: view === 'mine' ? { ownerId: caseworkerId } : {},
        }),
      ]);

      const selectedCaseworker = caseworkersResponse.data.find(
        (caseworker: { id: number; name: string }) => caseworker.id === caseworkerId
      );

      if (!selectedCaseworker) {
        return res.redirect('/');
      }

      const cases = casesResponse.data.map((caseItem: { ownerId: number }) => ({
        ...caseItem,
        ownerName:
          caseworkersResponse.data.find(
            (caseworker: { id: number; name: string }) => caseworker.id === caseItem.ownerId
          )?.name ?? 'Unknown',
      }));

      res.render('cases', {
        cases,
        caseworker: selectedCaseworker,
        view,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/cases/:id', async (req, res, next) => {
    try {
      const caseId = Number(req.params.id);
      const caseworkerId = Number(req.query.caseworkerId);

      if (!Number.isSafeInteger(caseworkerId) || caseworkerId <= 0) {
        return res.redirect('/');
      }

      const [caseResponse, tasksResponse, caseworkersResponse, taskStatusesResponse] = await Promise.all([
        axios.get(`http://localhost:4000/cases/${caseId}`),
        axios.get(`http://localhost:4000/cases/${caseId}/tasks`),
        axios.get('http://localhost:4000/caseworkers'),
        axios.get('http://localhost:4000/task-statuses'),
      ]);

      const requestedStatus = req.query.status;

      const validStatuses = taskStatusesResponse.data.map((taskStatus: { code: string }) => taskStatus.code);

      const selectedStatus =
        typeof requestedStatus === 'string' && validStatuses.includes(requestedStatus) ? requestedStatus : '';

      const selectedSort = req.query.sort === 'desc' ? 'desc' : 'asc';

      const caseworkers = caseworkersResponse.data;

      const selectedCaseworker = caseworkers.find(
        (caseworker: { id: number; name: string }) => caseworker.id === caseworkerId
      );

      if (!selectedCaseworker) {
        return res.redirect('/');
      }

      const owner = caseworkers.find(
        (caseworker: { id: number; name: string }) => caseworker.id === caseResponse.data.ownerId
      );

      const allTasks = tasksResponse.data;

      const filteredTasks = selectedStatus
        ? allTasks.filter((task: { status: string }) => task.status === selectedStatus)
        : allTasks;

      const sortedTasks = [...filteredTasks].sort((a: { dueAt: string | null }, b: { dueAt: string | null }) => {
        // Tasks without a due date always appear last.
        if (!a.dueAt && !b.dueAt) {
          return 0;
        }

        if (!a.dueAt) {
          return 1;
        }

        if (!b.dueAt) {
          return -1;
        }

        const comparison = Date.parse(a.dueAt) - Date.parse(b.dueAt);

        return selectedSort === 'desc' ? -comparison : comparison;
      });

      const tasks = sortedTasks.map((task: { dueAt: string | null }) => ({
        ...task,
        formattedDueAt: task.dueAt
          ? DateTime.fromISO(task.dueAt, { zone: 'utc' }).setZone('Europe/London').toFormat('d LLLL yyyy, HH:mm')
          : 'Not set',
      }));

      res.render('case-details', {
        caseItem: caseResponse.data,
        tasks,
        caseworker: selectedCaseworker,
        ownerName: owner?.name ?? 'Unknown',
        taskStatuses: taskStatusesResponse.data,
        selectedStatus,
        selectedSort,
        hasTasks: allTasks.length > 0,
      });
    } catch (error) {
      next(error);
    }
  });
}
