import axios from 'axios';
import request from 'supertest';

import { app } from '../../main/app';

jest.mock('axios');

const mockedAxios = jest.mocked(axios);

describe('Task routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display the new task form for a case', async () => {
    mockedAxios.get.mockImplementation(async url => {
      if (url === 'http://localhost:4000/cases/10') {
        return {
          data: {
            id: 10,
            ownerId: 1,
            title: 'Test case',
            description: 'A case for testing',
          },
        };
      }

      if (url === 'http://localhost:4000/caseworkers') {
        return {
          data: [
            { id: 1, name: 'Danger Mouse' },
            { id: 2, name: 'Count Duckula' },
          ],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    const response = await request(app).get('/cases/10/tasks/new?caseworkerId=1').expect(200);

    expect(response.text).toContain('Test case');
    expect(response.text).toContain('Create task');

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/cases/10');
  });

  test('should create a task and redirect to the case details page', async () => {
    mockedAxios.get.mockImplementation(async url => {
      if (url === 'http://localhost:4000/cases/10') {
        return {
          data: {
            id: 10,
            ownerId: 1,
            title: 'Test case',
            description: 'A case for testing',
          },
        };
      }

      if (url === 'http://localhost:4000/caseworkers') {
        return {
          data: [{ id: 1, name: 'Danger Mouse' }],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    mockedAxios.post.mockResolvedValue({
      data: { id: 20 },
    });

    const response = await request(app)
      .post('/cases/10/tasks?caseworkerId=1')
      .type('form')
      .send({
        title: 'Review documents',
        description: 'Check submitted evidence',
        dueDay: '15',
        dueMonth: '12',
        dueYear: '2026',
        dueTime: '14:30',
      })
      .expect(302);

    expect(response.headers.location).toBe('/cases/10?caseworkerId=1');

    expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:4000/tasks', {
      caseId: 10,
      createdBy: 1,
      title: 'Review documents',
      description: 'Check submitted evidence',
      dueAt: '2026-12-15T14:30:00.000Z',
    });
  });

  test('should reject task creation when the title is missing', async () => {
    mockedAxios.get.mockImplementation(async url => {
      if (url === 'http://localhost:4000/cases/10') {
        return {
          data: {
            id: 10,
            ownerId: 1,
            title: 'Test case',
            description: 'A case for testing',
          },
        };
      }

      if (url === 'http://localhost:4000/caseworkers') {
        return {
          data: [{ id: 1, name: 'Danger Mouse' }],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    const response = await request(app)
      .post('/cases/10/tasks?caseworkerId=1')
      .type('form')
      .send({
        title: '',
        description: 'Check submitted evidence',
        dueDay: '15',
        dueMonth: '12',
        dueYear: '2026',
        dueTime: '14:30',
      })
      .expect(400);

    expect(response.text).toContain('Enter a task title');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  test('should reject an invalid due date', async () => {
    mockedAxios.get.mockImplementation(async url => {
      if (url === 'http://localhost:4000/cases/10') {
        return {
          data: {
            id: 10,
            ownerId: 1,
            title: 'Test case',
            description: 'A case for testing',
          },
        };
      }

      if (url === 'http://localhost:4000/caseworkers') {
        return {
          data: [{ id: 1, name: 'Danger Mouse' }],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    const response = await request(app)
      .post('/cases/10/tasks?caseworkerId=1')
      .type('form')
      .send({
        title: 'Review documents',
        description: 'Check submitted evidence',
        dueDay: '31',
        dueMonth: '11',
        dueYear: '2026',
        dueTime: '14:30',
      })
      .expect(400);

    expect(response.text).toContain('Enter a valid due date');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  test('should display task details with the creator name', async () => {
    mockedAxios.get.mockImplementation(async url => {
      if (url === 'http://localhost:4000/tasks/9') {
        return {
          data: {
            id: 9,
            caseId: 10,
            createdBy: 2,
            title: 'Review Supporting Evidence',
            description: 'Check the submitted documents',
            status: 'TODO',
            dueAt: '2026-11-05T14:30:00Z',
          },
        };
      }

      if (url === 'http://localhost:4000/caseworkers') {
        return {
          data: [
            { id: 1, name: 'Danger Mouse' },
            { id: 2, name: 'Count Duckula' },
          ],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    const response = await request(app).get('/tasks/9?caseworkerId=1').expect(200);

    expect(response.text).toContain('Review Supporting Evidence');
    expect(response.text).toContain('Check the submitted documents');
    expect(response.text).toContain('TODO');
    expect(response.text).toContain('5 November 2026, 14:30');
    expect(response.text).toContain('Count Duckula');

    expect(response.text).toContain('/cases/10?caseworkerId=1');

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/tasks/9');
  });

  test('should update a task status and redirect to task details', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        { code: 'TODO', label: 'To do' },
        { code: 'IN_PROGRESS', label: 'In progress' },
        { code: 'DONE', label: 'Done' },
      ],
    });

    mockedAxios.patch.mockResolvedValue({
      data: { id: 9, status: 'IN_PROGRESS' },
    });

    const response = await request(app)
      .post('/tasks/9/status?caseworkerId=1')
      .type('form')
      .send({ status: 'IN_PROGRESS' })
      .expect(302);

    expect(mockedAxios.patch).toHaveBeenCalledWith('http://localhost:4000/tasks/9', { status: 'IN_PROGRESS' });

    expect(response.headers.location).toBe('/tasks/9?caseworkerId=1');
  });

  test('should reject an invalid task status', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        { code: 'TODO', label: 'To do' },
        { code: 'IN_PROGRESS', label: 'In progress' },
        { code: 'DONE', label: 'Done' },
      ],
    });

    const response = await request(app)
      .post('/tasks/9/status?caseworkerId=1')
      .type('form')
      .send({ status: 'INVALID' })
      .expect(400);

    expect(response.text).toContain('Invalid task status');
    expect(mockedAxios.patch).not.toHaveBeenCalled();
  });

  test('should delete a task and redirect to its case', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        id: 9,
        caseId: 10,
        title: 'Review supporting evidence',
      },
    });

    mockedAxios.delete.mockResolvedValue({
      status: 204,
    });

    const response = await request(app).post('/tasks/9/delete?caseworkerId=1').expect(302);

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/tasks/9');

    expect(mockedAxios.delete).toHaveBeenCalledWith('http://localhost:4000/tasks/9');

    expect(response.headers.location).toBe('/cases/10?caseworkerId=1');
  });

  test('should reject task deletion with an invalid task ID', async () => {
    const response = await request(app).post('/tasks/invalid/delete?caseworkerId=1').expect(302);

    expect(response.headers.location).toBe('/');

    expect(mockedAxios.get).not.toHaveBeenCalled();
    expect(mockedAxios.delete).not.toHaveBeenCalled();
  });

  test('should display the task deletion confirmation page', async () => {
    mockedAxios.get.mockImplementation(async url => {
      if (url === 'http://localhost:4000/tasks/9') {
        return {
          data: {
            id: 9,
            caseId: 10,
            title: 'Review supporting evidence',
          },
        };
      }

      if (url === 'http://localhost:4000/caseworkers') {
        return {
          data: [{ id: 1, name: 'Danger Mouse' }],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    const response = await request(app).get('/tasks/9/delete?caseworkerId=1&returnTo=case').expect(200);

    expect(response.text).toContain('Review supporting evidence');
    expect(response.text).toContain('This action cannot be undone');
    expect(response.text).toContain('/cases/10?caseworkerId=1');
    expect(response.text).toContain('Delete task');
  });

  describe('task due-date edge cases', () => {
    beforeEach(() => {
      mockedAxios.get.mockImplementation(async url => {
        if (url === 'http://localhost:4000/cases/10') {
          return {
            data: {
              id: 10,
              ownerId: 1,
              title: 'Test case',
              description: 'A case for testing',
            },
          };
        }

        if (url === 'http://localhost:4000/caseworkers') {
          return {
            data: [{ id: 1, name: 'Danger Mouse' }],
          };
        }

        throw new Error(`Unexpected API request: ${url}`);
      });
    });

    test.each([
      {
        scenario: 'a due date in the past',
        dueDay: '15',
        dueMonth: '12',
        dueYear: '2020',
        dueTime: '14:30',
        message: 'Due date and time must be in the future',
      },
      {
        scenario: 'a nonexistent time when UK clocks move forward',
        dueDay: '28',
        dueMonth: '3',
        dueYear: '2027',
        dueTime: '01:30',
        message: 'This time does not exist because the clocks change',
      },
      {
        scenario: 'an ambiguous time when UK clocks move back',
        dueDay: '31',
        dueMonth: '10',
        dueYear: '2027',
        dueTime: '01:30',
        message: 'This time occurs twice because the clocks change',
      },
    ])('should reject $scenario', async ({ dueDay, dueMonth, dueYear, dueTime, message }) => {
      const response = await request(app)
        .post('/cases/10/tasks?caseworkerId=1')
        .type('form')
        .send({
          title: 'Review documents',
          description: 'Check submitted evidence',
          dueDay,
          dueMonth,
          dueYear,
          dueTime,
        })
        .expect(400);

      expect(response.text).toContain(message);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('backend API failures', () => {
    test('should not redirect as successful when task creation fails', async () => {
      mockedAxios.get.mockImplementation(async url => {
        if (url === 'http://localhost:4000/cases/10') {
          return {
            data: {
              id: 10,
              ownerId: 1,
              title: 'Test case',
              description: 'A case for testing',
            },
          };
        }

        if (url === 'http://localhost:4000/caseworkers') {
          return {
            data: [{ id: 1, name: 'Danger Mouse' }],
          };
        }

        throw new Error(`Unexpected API request: ${url}`);
      });

      mockedAxios.post.mockRejectedValue(new Error('Backend task creation failed'));

      const response = await request(app)
        .post('/cases/10/tasks?caseworkerId=1')
        .type('form')
        .send({
          title: 'Review documents',
          description: 'Check submitted evidence',
          dueDay: '15',
          dueMonth: '12',
          dueYear: '2026',
          dueTime: '14:30',
        })
        .expect(500);

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(response.headers.location).toBeUndefined();
      expect(response.text).toContain('Something went wrong');
    });
  });
});
