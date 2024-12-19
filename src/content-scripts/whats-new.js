const whatsNewViewed = async () => {
  const latestViewedVersion = await browser.runtime.sendMessage({
    type: "whatsNew.getViewedVersion",
  });
  return latestViewedVersion === VERSION;
};

const setWhatsNewViewed = async () => browser.runtime.sendMessage({
  type: "whatsNew.setViewedVersion",
  data: VERSION,
});

whatsNewViewed()
  .then(async isViewed => {
    if (!isViewed) {
      await setWhatsNewViewed();
      const shouldPopup = confirm(`Hunter extension has been updated to version ${VERSION}! Open what's new page?`);
      if (shouldPopup) {
        window.open("https://gavinmorrow.github.io/hunter-extension/CHANGELOG", "_blank");
      }
    }
  });
