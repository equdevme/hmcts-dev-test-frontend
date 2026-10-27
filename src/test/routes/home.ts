import axios from 'axios';
import request from 'supertest';

import { app } from '../../main/app';

jest.mock('axios');

const mockedAxios = jest.mocked(axios);

describe('Home page', () => {
  test('should display tasks returned by the API', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          title: 'Review case documents',
          status: 'TODO',
          dueAt: '2026-11-05T12:00:00',
        },
      ],
    });

    const response = await request(app).get('/').expect(200);

    expect(response.text).toContain('Review case documents');
    expect(response.text).toContain('TODO');
    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:4000/tasks');
  });
});
