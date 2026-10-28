import axios from 'axios';
import request from 'supertest';

import { app } from '../../main/app';

jest.mock('axios');

const mockedAxios = jest.mocked(axios);

describe('Home page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display caseworkers returned by the API', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        { id: 1, name: 'Danger Mouse' },
        { id: 2, name: 'Count Duckula' },
        { id: 3, name: 'Super Ted' },
      ],
    });

    const response = await request(app).get('/').expect(200);

    expect(response.text).toContain('Select a caseworker');
    expect(response.text).toContain('Danger Mouse');
    expect(response.text).toContain('Count Duckula');
    expect(response.text).toContain('Super Ted');

    expect(response.text).toContain('/cases?caseworkerId=1');
    expect(response.text).toContain('/cases?caseworkerId=2');
    expect(response.text).toContain('/cases?caseworkerId=3');

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/caseworkers');
  });
});
