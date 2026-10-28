import axios from 'axios';
import request from 'supertest';

import { app } from '../../main/app';

jest.mock('axios');

const mockedAxios = jest.mocked(axios);

describe('Cases routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display cases with their owners', async () => {
    mockedAxios.get.mockImplementation(async url => {
      if (url === 'http://localhost:4000/caseworkers') {
        return {
          data: [
            { id: 1, name: 'Danger Mouse' },
            { id: 2, name: 'Count Duckula' },
          ],
        };
      }

      if (url === 'http://localhost:4000/cases') {
        return {
          data: [
            {
              id: 10,
              ownerId: 1,
              title: 'Test case',
              description: 'A case for testing',
            },
          ],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    const response = await request(app).get('/cases?caseworkerId=1').expect(200);

    expect(response.text).toContain('Test case');
    expect(response.text).toContain('Danger Mouse');
    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/cases', { params: {} });
  });

  test('should filter cases by the selected caseworker', async () => {
    mockedAxios.get.mockImplementation(async url => {
      if (url === 'http://localhost:4000/caseworkers') {
        return {
          data: [
            { id: 1, name: 'Danger Mouse' },
            { id: 2, name: 'Count Duckula' },
          ],
        };
      }

      if (url === 'http://localhost:4000/cases') {
        return {
          data: [
            {
              id: 10,
              ownerId: 1,
              title: 'Danger Mouse case',
              description: 'A test case',
            },
          ],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    const response = await request(app).get('/cases?caseworkerId=1&view=mine').expect(200);

    expect(response.text).toContain('Danger Mouse case');

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/cases', { params: { ownerId: 1 } });
  });

  test('should display case details and associated tasks', async () => {
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

      if (url === 'http://localhost:4000/cases/10/tasks') {
        return {
          data: [
            {
              id: 20,
              caseId: 10,
              createdBy: 2,
              title: 'Review documents',
              description: 'Check submitted evidence',
              status: 'TODO',
              dueAt: '2026-11-10T14:00:00Z',
            },
          ],
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

    const response = await request(app).get('/cases/10?caseworkerId=2').expect(200);

    expect(response.text).toContain('Test case');
    expect(response.text).toContain('Review documents');
    expect(response.text).toContain('10 November 2026, 14:00');
    expect(response.text).toContain('Danger Mouse');

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/cases/10');
    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/cases/10/tasks');
  });
});
