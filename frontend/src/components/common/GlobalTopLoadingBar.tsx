import React from 'react';

/**
 * GlobalTopLoadingBar has been removed because realtime background updates/polling
 * caused continuous progress bar flickering at the top of the viewport.
 */
export const GlobalTopLoadingBar: React.FC = () => {
  return null;
};

export default GlobalTopLoadingBar;
