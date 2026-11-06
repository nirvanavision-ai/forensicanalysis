import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { captureShell, readEmbeddedCase } from './lib/exportCase';
import './styles/fonts.css';
import './styles/app.css';

// Capture the page before the app renders, so an exported analysis starts from a clean shell.
captureShell();
const embedded = readEmbeddedCase();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App embedded={embedded} />
  </StrictMode>,
);
