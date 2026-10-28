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
    const response = await request(app)
      .post('/tasks/9/status?caseworkerId=1')
      .type('form')
      .send({ status: 'INVALID' })
      .expect(400);

    expect(response.text).toContain('Invalid task status');
    expect(mockedAxios.patch).not.toHaveBeenCalled();
  });
});
