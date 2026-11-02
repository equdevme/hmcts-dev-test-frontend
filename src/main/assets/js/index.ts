import '../scss/main.scss';
import { initAll } from 'govuk-frontend';

import { initTaskStatus } from './task-status';

initAll();

document.addEventListener('DOMContentLoaded', () => {
  initTaskStatus();
});
