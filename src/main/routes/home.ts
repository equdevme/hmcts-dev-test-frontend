import axios from 'axios';
import { Application } from 'express';
import { DateTime } from 'luxon';

export default function (app: Application): void {
  app.get('/', async (req, res, next) => {
    try {
      const response = await axios.get('http://localhost:4000/caseworkers');

      res.render('home', {
        caseworkers: response.data,
      });
    } catch (error) {
      next(error);
    }
  });

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
        (caseworker: { id: number; name: string }) => caseworker.id === caseworkerId,
      );

      if (!selectedCaseworker) {
        return res.redirect('/');
      }

      const cases = casesResponse.data.map((caseItem: { ownerId: number }) => ({
        ...caseItem,
        ownerName: caseworkersResponse.data.find(
          (caseworker: { id: number; name: string }) => caseworker.id === caseItem.ownerId,
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

      const [caseResponse, tasksResponse, caseworkersResponse] = await Promise.all([
        axios.get(`http://localhost:4000/cases/${caseId}`),
        axios.get(`http://localhost:4000/cases/${caseId}/tasks`),
        axios.get('http://localhost:4000/caseworkers'),
      ]);

      const caseworkers = caseworkersResponse.data;

      const selectedCaseworker = caseworkers.find(
        (caseworker: { id: number; name: string }) => caseworker.id === caseworkerId,
      );

      if (!selectedCaseworker) {
        return res.redirect('/');
      }

      const owner = caseworkers.find(
        (caseworker: { id: number; name: string }) => caseworker.id === caseResponse.data.ownerId,
      );

      const tasks = tasksResponse.data.map((task: { dueAt: string | null }) => ({
        ...task,
        formattedDueAt: task.dueAt
          ? DateTime.fromISO(task.dueAt, { zone: 'utc' })
              .setZone('Europe/London')
              .toFormat('d LLLL yyyy, HH:mm')
          : 'Not set',
      }));

      res.render('case-details', {
        caseItem: caseResponse.data,
        tasks,
        caseworker: selectedCaseworker,
        ownerName: owner?.name ?? 'Unknown',
      });

    } catch (error) {
      next(error);
    }
  });

  app.get('/cases/:id/tasks/new', async (req, res, next) => {
    try {
      const caseId = Number(req.params.id);
      const caseworkerId = Number(req.query.caseworkerId);

      if (!Number.isSafeInteger(caseworkerId) || caseworkerId <= 0) {
        return res.redirect('/');
      }

      const [caseResponse, caseworkersResponse] = await Promise.all([
        axios.get(`http://localhost:4000/cases/${caseId}`),
        axios.get('http://localhost:4000/caseworkers'),
      ]);

      const selectedCaseworker = caseworkersResponse.data.find(
        (caseworker: { id: number; name: string }) => caseworker.id === caseworkerId,
      );

      if (!selectedCaseworker) {
        return res.redirect('/');
      }

      res.render('task-create', {
        caseItem: caseResponse.data,
        caseworker: selectedCaseworker,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/cases/:id/tasks', async (req, res, next) => {
    try {
      const caseId = Number(req.params.id);
      const caseworkerId = Number(req.query.caseworkerId);

      if (!Number.isSafeInteger(caseId) || caseId <= 0 ||
          !Number.isSafeInteger(caseworkerId) || caseworkerId <= 0) {
        return res.redirect('/');
      }

      const [caseResponse, caseworkersResponse] = await Promise.all([
        axios.get(`http://localhost:4000/cases/${caseId}`),
        axios.get('http://localhost:4000/caseworkers'),
      ]);

      const selectedCaseworker = caseworkersResponse.data.find(
        (caseworker: { id: number; name: string }) => caseworker.id === caseworkerId,
      );

      if (!selectedCaseworker) {
        return res.redirect('/');
      }

      const { title, description, dueDay, dueMonth, dueYear, dueTime } = req.body;

      const errors: { field: string; message: string }[] = [];

      if (typeof title !== 'string' || !title.trim()) {
        errors.push({ field: 'title', message: 'Enter a task title' });
      }

      const day = Number(dueDay);
      const month = Number(dueMonth);
      const year = Number(dueYear);

      const validDateParts = [dueDay, dueMonth, dueYear].every(
        value => typeof value === 'string' && /^\d+$/.test(value),
      );

      const date = new Date(Date.UTC(year, month - 1, day));

      const validDate = validDateParts &&
        year >= 1000 && year <= 9999 &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;

      if (!validDate) {
        errors.push({ field: 'due-date', message: 'Enter a valid due date' });
      }

      const validTime = typeof dueTime === 'string' &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(dueTime);

      if (!validTime) {
        errors.push({ field: 'due-time', message: 'Enter a valid time in 24-hour format' });
      }

      let localDateTime: DateTime | null = null;

      if (validDate && validTime) {
        const [hour, minute] = dueTime.split(':').map(Number);

        localDateTime = DateTime.fromObject(
          { year, month, day, hour, minute },
          { zone: 'Europe/London' },
        );

        // Detect nonexistent local times when clocks go forward.
        const matchesInput =
          localDateTime.isValid &&
          localDateTime.year === year &&
          localDateTime.month === month &&
          localDateTime.day === day &&
          localDateTime.hour === hour &&
          localDateTime.minute === minute;

        if (!matchesInput) {
          errors.push({
            field: 'due-time',
            message: 'This time does not exist because the clocks change. Enter another time.',
          });
        } else if (localDateTime.getPossibleOffsets().length > 1) {
          // Detect ambiguous local times when clocks go back.
          errors.push({
            field: 'due-time',
            message: 'This time occurs twice because the clocks change. Enter another time.',
          });
        }
      }

      if (localDateTime?.isValid && localDateTime.toUTC() <= DateTime.utc()) {
        errors.push({
          field: 'due-date',
          message: 'Due date and time must be in the future',
        });
      }

      if (errors.length) {
        return res.status(400).render('task-create', {
          caseItem: caseResponse.data,
          caseworker: selectedCaseworker,
          errors,
          form: req.body,
        });
      }

      const dueAt = localDateTime!.toUTC().toISO();

      await axios.post('http://localhost:4000/tasks', {
        caseId,
        createdBy: caseworkerId,
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        dueAt,
      });

      return res.redirect(`/cases/${caseId}?caseworkerId=${caseworkerId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.dir(error.response?.data, { depth: null });
      } else {
        console.error(error);
      }
      next(error);
    }
  });

}
