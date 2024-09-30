/**
 * Run a function with the profile subnav open, and automatically close it when you're finished.
 * @template T
 * @param {(profileNav: HTMLElement) => T} fn
 * @returns Promise<T>
 */
const inProfileSubnav = async (fn) => {
  const profileNav = await waitForElem("a#account-nav");
  if (profileNav != null) {
    profileNav.click();

    const res = await fn(profileNav);

    // click outside to close
    document.body.click();

    return res;
  }
};

/**
 * Find the link to the user's profile.
 * @param {HTMLElement} profileNav
 * @returns {Promise<String?>}
 */
const findProfileHref = async (profileNav) => {
  const subnav = profileNav?.nextElementSibling?.nextElementSibling;
  const profileLink = await waitFor(() => subnav?.querySelector("li a")); // the first one
  return profileLink?.href;
};

/** @param {String?} href */
const parseProfileLinkHref = (href) => {
  const regexp = /\/app\/student#profile\/(?<id>\d+)\//;
  const userId = href.match(regexp)?.groups.id;
  return userId;
};

let _getStudentUserIdCache = null;
/**
 * Scrape the page for the student user id.
 * @returns {Promise<string?>} The student user id, or null.
 */
const getStudentUserId = async () => {
  if (_getStudentUserIdCache) return _getStudentUserIdCache;
  const href = await inProfileSubnav(findProfileHref);
  const id = parseProfileLinkHref(href);
  _getStudentUserIdCache = id;
  return id;
};
