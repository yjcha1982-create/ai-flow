import React from 'react';
import { createRoot } from 'react-dom/client';
import 'react-flow-renderer/dist/style.css';
import App from './App';
import './styles/app.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
