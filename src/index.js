import React from 'react';
import { createRoot } from 'react-dom/client';
import 'react-flow-renderer/dist/style.css';
import App from './App';
import BoardApp from './board/BoardApp';
import './styles/app.css';

const container = document.getElementById('root');
const root = createRoot(container);
const isBoard =
  window.location.pathname.startsWith('/board') ||
  window.location.hash.startsWith('#/board');
root.render(isBoard ? <BoardApp /> : <App />);
