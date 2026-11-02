import axios from 'axios';
import { Application } from 'express';
import { DateTime } from 'luxon';

export default function (app: Application): void {
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
        (caseworker: { id: number; name: string }) => caseworker.id === caseworkerId
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

      if (!Number.isSafeInteger(caseId) || caseId <= 0 || !Number.isSafeInteger(caseworkerId) || caseworkerId <= 0) {
        return res.redirect('/');
      }

      const [caseResponse, caseworkersResponse] = await Promise.all([
        axios.get(`http://localhost:4000/cases/${caseId}`),
        axios.get('http://localhost:4000/caseworkers'),
      ]);

      const selectedCaseworker = caseworkersResponse.data.find(
        (caseworker: { id: number; name: string }) => caseworker.id === caseworkerId
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
        value => typeof value === 'string' && /^\d+$/.test(value)
      );

      const date = new Date(Date.UTC(year, month - 1, day));

      const validDate =
        validDateParts &&
        year >= 1000 &&
        year <= 9999 &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;

      if (!validDate) {
        errors.push({ field: 'due-date', message: 'Enter a valid due date' });
      }

      const validTime = typeof dueTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(dueTime);

      if (!validTime) {
        errors.push({ field: 'due-time', message: 'Enter a valid time in 24-hour format' });
      }

      let localDateTime: DateTime | null = null;

      if (validDate && validTime) {
        const [hour, minute] = dueTime.split(':').map(Number);

        localDateTime = DateTime.fromObject({ year, month, day, hour, minute }, { zone: 'Europe/London' });

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

  app.get('/tasks/:id', async (req, res, next) => {
    try {
      const taskId = Number(req.params.id);
      const caseworkerId = Number(req.query.caseworkerId);

      if (!Number.isSafeInteger(taskId) || taskId <= 0 || !Number.isSafeInteger(caseworkerId) || caseworkerId <= 0) {
        return res.redirect('/');
      }

      const [taskResponse, caseworkersResponse, statusesResponse] = await Promise.all([
        axios.get(`http://localhost:4000/tasks/${taskId}`),
        axios.get('http://localhost:4000/caseworkers'),
        axios.get('http://localhost:4000/task-statuses'),
      ]);

      const caseworker = caseworkersResponse.data.find((cw: { id: number; name: string }) => cw.id === caseworkerId);

      if (!caseworker) {
        return res.redirect('/');
      }

      const task = {
        ...taskResponse.data,
        formattedDueAt: taskResponse.data.dueAt
          ? DateTime.fromISO(taskResponse.data.dueAt, { zone: 'utc' })
              .setZone('Europe/London')
              .toFormat('d LLLL yyyy, HH:mm')
          : 'Not set',
      };

      const creator = caseworkersResponse.data.find((cw: { id: number; name: string }) => cw.id === task.createdBy);

      res.render('task-details', {
        task,
        caseworker,
        creatorName: creator?.name ?? 'Unknown',
        taskStatuses: statusesResponse.data,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/tasks/:id/status', async (req, res, next) => {
    try {
      const taskId = Number(req.params.id);
      const caseworkerId = Number(req.query.caseworkerId);
      const { status } = req.body;

      if (!Number.isSafeInteger(taskId) || taskId <= 0 || !Number.isSafeInteger(caseworkerId) || caseworkerId <= 0) {
        return res.redirect('/');
      }

      const statusesResponse = await axios.get('http://localhost:4000/task-statuses');

      const validStatuses = statusesResponse.data.map((taskStatus: { code: string }) => taskStatus.code);

      if (typeof status !== 'string' || !validStatuses.includes(status)) {
        return res.status(400).send('Invalid task status');
      }

      const taskResponse = await axios.get(`http://localhost:4000/tasks/${taskId}`);

      await axios.patch(`http://localhost:4000/tasks/${taskId}`, {
        status,
      });

      if (req.query.returnTo === 'case') {
        return res.redirect(`/cases/${taskResponse.data.caseId}?caseworkerId=${caseworkerId}`);
      }

      return res.redirect(`/tasks/${taskId}?caseworkerId=${caseworkerId}`);
    } catch (error) {
      return next(error);
    }
  });

  app.get('/tasks/:id/delete', async (req, res, next) => {
    try {
      const taskId = Number(req.params.id);
      const caseworkerId = Number(req.query.caseworkerId);

      if (!Number.isSafeInteger(taskId) || taskId <= 0 || !Number.isSafeInteger(caseworkerId) || caseworkerId <= 0) {
        return res.redirect('/');
      }

      const [taskResponse, caseworkersResponse] = await Promise.all([
        axios.get(`http://localhost:4000/tasks/${taskId}`),
        axios.get('http://localhost:4000/caseworkers'),
      ]);

      const caseworker = caseworkersResponse.data.find((cw: { id: number; name: string }) => cw.id === caseworkerId);

      if (!caseworker) {
        return res.redirect('/');
      }

      const returnTo = req.query.returnTo === 'case' ? 'case' : 'task';

      const cancelUrl =
        returnTo === 'case'
          ? `/cases/${taskResponse.data.caseId}?caseworkerId=${caseworkerId}`
          : `/tasks/${taskId}?caseworkerId=${caseworkerId}`;

      return res.render('task-delete', {
        task: taskResponse.data,
        caseworker,
        cancelUrl,
        returnTo,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/tasks/:id/delete', async (req, res, next) => {
    try {
      const taskId = Number(req.params.id);
      const caseworkerId = Number(req.query.caseworkerId);

      if (!Number.isSafeInteger(taskId) || taskId <= 0 || !Number.isSafeInteger(caseworkerId) || caseworkerId <= 0) {
        return res.redirect('/');
      }

      const taskResponse = await axios.get(`http://localhost:4000/tasks/${taskId}`);

      const caseId = taskResponse.data.caseId;

      await axios.delete(`http://localhost:4000/tasks/${taskId}`);

      return res.redirect(`/cases/${caseId}?caseworkerId=${caseworkerId}`);
    } catch (error) {
      return next(error);
    }
  });
}
