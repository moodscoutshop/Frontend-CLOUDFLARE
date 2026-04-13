import React, { useEffect } from 'react';

const EzoicAd = ({ placeholderId }) => {
  useEffect(() => {
    // Check if Ezoic's standalone script has loaded
    if (window.ezstandalone && window.ezstandalone.cmd) {
      window.ezstandalone.cmd.push(function () {
        // Ezoic recommends passing the ID to showAds() for specific placements
        window.ezstandalone.showAds(placeholderId);
      });
    }
  }, [placeholderId]);

  // Ezoic requires the ID format: ezoic-pub-ad-placeholder-{ID}
  // Important: Ezoic documentation states DO NOT add any styling directly to this div.
  return (
    <div id={`ezoic-pub-ad-placeholder-${placeholderId}`}></div>
  );
};

export default EzoicAd;
