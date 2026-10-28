import axios from 'axios';
import { Application } from 'express';

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
}
