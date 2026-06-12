import { normalizeProject } from './projectModel';

const STORAGE_KEY = 'ai-flow-project';
const LEGACY_KEY = 'ai-uml-prototype';

export function saveProject(project) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
}

export function loadProject() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return normalizeProject(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return null;
  return null;
}

export function clearProject() {
  localStorage.removeItem(STORAGE_KEY);
}
