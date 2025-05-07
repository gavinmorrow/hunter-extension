/** @returns {Promise<number>} */
const getLatestVersion = async () => {
  // Don't use Promise methods to avoid `InternalError: Promise rejection
  // value is a non-unwrappable cross-compartment wrapper.`
  // (see <https://bugzilla.mozilla.org/show_bug.cgi?id=1871516>)
  try {
    const res = await fetch(
      "https://gavinmorrow.github.io/hunter-extension/updates.json",
      {
        cache: "no-cache",
      },
    );
    const json = await res.json();
    const versions =
      json.addons["{a58d637c-b5fb-4549-a2f6-ae76b6dd6672}"].updates;
    return versions[versions.length - 1].version;
  } catch (err) {
    throw new ApiError("checkForUpdates", err);
  }
};

/** @param {String} a @param {String} b */
const compareVersions = (a, b) => {
  const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
  const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
  if (aMajor > bMajor) return -1;
  else if (aMajor < bMajor) return 1;
  else {
    if (aMinor > bMinor) return -1;
    else if (aMinor < bMinor) return 1;
    else {
      if (aPatch > bPatch) return -1;
      else if (bPatch > aPatch) return 1;
      else return 0;
    }
  }
};

promiseError(async () => {
  // Don't use Promise methods to avoid `InternalError: Promise rejection
  // value is a non-unwrappable cross-compartment wrapper.`
  // (see <https://bugzilla.mozilla.org/show_bug.cgi?id=1871516>)
  try {
    const latest = await getLatestVersion();
    const newVersionAvailable = compareVersions(VERSION, latest) === 1;
    if (newVersionAvailable) {
      BannerAlert.createBanner(
        `New version available! Current: ${VERSION}, Latest: ${latest}`,
        "info",
        // TODO: include info on how to update
      );
    }
  } catch (err) {
    reportError(err);
  }
})();
