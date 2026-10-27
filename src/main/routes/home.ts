import axios from 'axios';
import { Application } from 'express';

export default function (app: Application): void {
  app.get('/', async (req, res, next) => {
    try {
      const response = await axios.get('http://localhost:4000/tasks');

      res.render('home', {
        tasks: response.data,
      });
    } catch (error) {
      next(error);
    }
  });
}
