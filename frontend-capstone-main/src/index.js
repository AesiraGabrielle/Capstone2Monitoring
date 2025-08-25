import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faExclamationTriangle, 
  faUser, 
  faCog, 
  faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons';

// Add Font Awesome icons
library.add(
  faExclamationTriangle,
  faUser,
  faCog,
  faSignOutAlt
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);