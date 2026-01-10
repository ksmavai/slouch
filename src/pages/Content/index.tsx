import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './content.styles.css';
import Content from './Content';

// Mount content UI to listen for alignment status messages on every page
(function mountContent() {
  if (document.getElementById('kr-alignment-app-content')) return;
  const element = document.createElement('div');
  element.setAttribute('id', 'kr-alignment-app-content');
  element.className = 'kr-alignment-app-content';
  document.body.appendChild(element);
  ReactDOM.render(<Content />, element);
})();
