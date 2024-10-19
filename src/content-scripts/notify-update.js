const VERSION = "0.2.0";

/** @returns {Promise<number>} */
const getLatestVersion = async () =>
  fetch("https://gavinmorrow.github.io/hunter-extension/versions.json", {
    cache: "no-cache",
  })
    .then((r) => r.json())
    .then((versions) => versions.latest)
    .catch((err) => {
      console.error("Error checking for update.", err);
      return "0.0.0";
    });

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
  const latest = await getLatestVersion();
  const newVersionAvailable = compareVersions(VERSION, latest) === 1;
  if (newVersionAvailable)
    alert(`New version available!\nCurrent: ${VERSION}\nLatest: ${latest}`);
})();
