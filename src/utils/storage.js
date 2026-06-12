const STORAGE_KEY = 'ai-uml-prototype';

export function saveDiagram(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadDiagram() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDiagram() {
  localStorage.removeItem(STORAGE_KEY);
}
