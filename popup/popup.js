import { communicator, MessageType } from '../common/messaging.js';
import { store } from './store.js';
import { storageManager } from '../common/storage.js';


async function initializeMockToggle() {
  const toggle = document.getElementById('mock-toggle');

  const useMocks = await storageManager.get('useMocks', true);
  toggle.checked = useMocks;

  toggle.addEventListener('change', async (event) => {
    const newUseMocks = event.target.checked;
    await storageManager.set('useMocks', newUseMocks);
  });
}

function handleExport() {
  storageManager.getAll().then(data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function handleImport() {
  const fileInput = document.getElementById('import-file-input');
  fileInput.click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      await storageManager.clear();
      await storageManager.setAll(data);
      // Reload the popup to reflect imported data
      location.reload();
    } catch (error) {
      console.error('Failed to import data:', error);
      alert('Error: Invalid JSON file.');
    }
  };
  reader.readAsText(file);

  // Reset file input to allow importing the same file again
  event.target.value = '';
}

function initialize() {
  initializeMockToggle();
  document.getElementById('export-button').addEventListener('click', handleExport);
  document.getElementById('import-button').addEventListener('click', handleImport);
  document.getElementById('import-file-input').addEventListener('change', handleFileSelect);
}

initialize();
