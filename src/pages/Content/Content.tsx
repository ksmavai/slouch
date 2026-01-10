import React, { useState, useEffect, useRef } from 'react';

const BAD_ALIGNMENT = 'bad';
const GOOD_ALIGNMENT = 'good';

const Content = () => {
  const [alignmentStatus, setAlignmentStatus] = useState<String | null>(null);

  useEffect(() => {
    try {
      chrome.runtime.onMessage.addListener(function (msg: any) {
        console.log('[content] received message:', msg);
        if (msg && msg.alignment) {
          if (msg.alignment === BAD_ALIGNMENT) {
            handleMisaligned();
          } else if (msg.alignment === GOOD_ALIGNMENT) {
            handleAligned();
          }
        }
        return true;
      });
    } catch (error) {
      console.error({ message: `port couldn't connect `, error });
    }
  }, []);

  function handleMisaligned() {
    document.body.classList.remove('good-alignment');
    document.body.classList.add('bad-alignment');
    setAlignmentStatus(BAD_ALIGNMENT);
  }

  function handleAligned() {
    document.body.classList.add('good-alignment');
    document.body.classList.remove('bad-alignment');
    setAlignmentStatus(GOOD_ALIGNMENT);
  }

  return (
    <div className="alignment-status-bar">
      {alignmentStatus === BAD_ALIGNMENT ? 'STOP SLOUCHING!' : ''}
    </div>
  );
};

export default Content;
