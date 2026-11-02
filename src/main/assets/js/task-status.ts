export function initTaskStatus(): void {
  const changeButton = document.getElementById('change-task-status');
  const cancelButton = document.getElementById('cancel-status-change');
  const statusForm = document.getElementById('task-status-form');
  const currentStatus = document.getElementById('current-task-status');
  const statusSelect = document.getElementById('status') as HTMLSelectElement | null;

  if (!changeButton || !cancelButton || !statusForm || !currentStatus || !statusSelect) {
    return;
  }

  const originalStatus = statusSelect.value;

  const setEditing = (editing: boolean): void => {
    statusForm.hidden = !editing;
    currentStatus.hidden = editing;
    changeButton.hidden = editing;
    changeButton.setAttribute('aria-expanded', String(editing));

    if (editing) {
      statusSelect.focus();
    } else {
      statusSelect.value = originalStatus;
      changeButton.focus();
    }
  };

  changeButton.addEventListener('click', () => setEditing(true));
  cancelButton.addEventListener('click', () => setEditing(false));

  statusForm.hidden = true;
}
