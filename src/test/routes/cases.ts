import axios from 'axios';
import request from 'supertest';

import { app } from '../../main/app';

jest.mock('axios');

const mockedAxios = jest.mocked(axios);

const caseworkers = [
  { id: 1, name: 'Danger Mouse' },
  { id: 2, name: 'Count Duckula' },
];

const testCase = {
  id: 10,
  ownerId: 1,
  title: 'Test case',
  description: 'A case for testing',
};

const taskStatuses = [
  { code: 'TODO', label: 'To do' },
  { code: 'IN_PROGRESS', label: 'In progress' },
  { code: 'DONE', label: 'Done' },
];

const tasks = [
  {
    id: 20,
    caseId: 10,
    createdBy: 2,
    title: 'Later task',
    description: 'Task due in December',
    status: 'TODO',
    dueAt: '2026-12-15T14:00:00Z',
  },
  {
    id: 21,
    caseId: 10,
    createdBy: 1,
    title: 'Earlier task',
    description: 'Task due in early November',
    status: 'IN_PROGRESS',
    dueAt: '2026-11-05T09:00:00Z',
  },
  {
    id: 22,
    caseId: 10,
    createdBy: 2,
    title: 'Middle task',
    description: 'Task due in late November',
    status: 'TODO',
    dueAt: '2026-11-20T12:00:00Z',
  },
];

describe('Cases routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedAxios.get.mockImplementation(async url => {
      if (url === 'http://localhost:4000/caseworkers') {
        return { data: caseworkers };
      }

      if (url === 'http://localhost:4000/cases') {
        return { data: [testCase] };
      }

      if (url === 'http://localhost:4000/cases/10') {
        return { data: testCase };
      }

      if (url === 'http://localhost:4000/cases/10/tasks') {
        return { data: tasks };
      }

      if (url === 'http://localhost:4000/task-statuses') {
        return { data: taskStatuses };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });
  });

  test('should display cases with their owners', async () => {
    const response = await request(app).get('/cases?caseworkerId=1').expect(200);

    expect(response.text).toContain('Test case');
    expect(response.text).toContain('Danger Mouse');

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/cases', { params: {} });
  });

  test('should filter cases by the selected caseworker', async () => {
    const response = await request(app).get('/cases?caseworkerId=1&view=mine').expect(200);

    expect(response.text).toContain('Test case');

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/cases', { params: { ownerId: 1 } });
  });

  test('should display case details and associated tasks', async () => {
    const response = await request(app).get('/cases/10?caseworkerId=2').expect(200);

    expect(response.text).toContain('Test case');
    expect(response.text).toContain('Earlier task');
    expect(response.text).toContain('5 November 2026, 09:00');
    expect(response.text).toContain('Danger Mouse');
    expect(response.text).toContain('In progress');

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/cases/10');

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/cases/10/tasks');

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/task-statuses');
  });

  test('should sort tasks by earliest due date by default', async () => {
    const response = await request(app).get('/cases/10?caseworkerId=1').expect(200);

    expect(response.text.indexOf('Earlier task')).toBeLessThan(response.text.indexOf('Middle task'));

    expect(response.text.indexOf('Middle task')).toBeLessThan(response.text.indexOf('Later task'));
  });

  test('should sort tasks by latest due date when requested', async () => {
    const response = await request(app).get('/cases/10?caseworkerId=1&sort=desc').expect(200);

    expect(response.text.indexOf('Later task')).toBeLessThan(response.text.indexOf('Middle task'));

    expect(response.text.indexOf('Middle task')).toBeLessThan(response.text.indexOf('Earlier task'));

    expect(response.text).toContain('value="desc"');
  });

  test('should filter tasks by status', async () => {
    const response = await request(app).get('/cases/10?caseworkerId=1&status=TODO').expect(200);

    expect(response.text).toContain('Later task');
    expect(response.text).toContain('Middle task');
    expect(response.text).not.toContain('Earlier task');
  });

  test('should filter and sort tasks together', async () => {
    const response = await request(app).get('/cases/10?caseworkerId=1&status=TODO&sort=desc').expect(200);

    expect(response.text).not.toContain('Earlier task');

    expect(response.text.indexOf('Later task')).toBeLessThan(response.text.indexOf('Middle task'));
  });

  test('should ignore an invalid status filter', async () => {
    const response = await request(app).get('/cases/10?caseworkerId=1&status=INVALID').expect(200);

    expect(response.text).toContain('Earlier task');
    expect(response.text).toContain('Middle task');
    expect(response.text).toContain('Later task');
  });

  test('should display a message when no tasks match the selected status', async () => {
    const response = await request(app).get('/cases/10?caseworkerId=1&status=DONE').expect(200);

    expect(response.text).toContain('No tasks match the selected status.');
    expect(response.text).not.toContain('Earlier task');
    expect(response.text).not.toContain('Middle task');
    expect(response.text).not.toContain('Later task');
  });
});
