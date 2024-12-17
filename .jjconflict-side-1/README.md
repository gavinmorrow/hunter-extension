# Hunter Extension

_v0.2.6_

This project aims to fix as much of the Hunter website as possible. It does this
through a browser extension. To report problems or request a feature, please
email gavinmorrow (at) hunterschools (dot) org.

## Features

- **Custom UI**: Make an actually good assignment center calendar view!!
- **Login automatically**: Automatically press the various "next" buttons when
  you want to log in.
- Automatically deselect "Completed", so you don't need to manually do it (only
  activated when the custom ui is not active).
- Other miscellaneous bug and styling fixes.

[Full Changelog]

## Installation

If your browser of choice is not supported yet, send me a feature request to
support it and I'll do my best. Please note that at the moment, this is only
available for desktop (not mobile).

Safari is also not supported at the moment, although I'm working on it. If you
use Safari (like me), send me an email and I'll prioritize it!

### Chrome

1. Go to the page for the [latest release][latest].
2. Under `Assets`, download the `hunter-extension-<version>.zip` file.
3. Open that file in File Explorer/Finder/etc and extract/open it.
4. In Chrome, go to `chrome://extensions`.
5. If updating, remove the old version of the extension.
6. Click the toggle that says `Developer mode` in the top right corner.
7. Click the `Load unpacked` button.
8. For both Windows and macOS: In the file picker, go to `Downloads`, then
   double-click on `hunter-extension-<version>`.
9. Then, if you are on Windows, single-click `hunter-extension-<version>`.
10. Click `Select` (bottom right corner).
11. Go to the hunter website!

### Firefox

Click [here][firefox] to install. (You should use firefox!!)

To update, see the [Mozilla help page].

## Permissions

- It will ask for permissions on `hunterschools.myschoolapp.com`,
  `app.blackbaud.com`, and `accounts.google.com`.
  - hunterschools: This is the Hunter website.
  - app.blackbaud: This is a domain used by Blackbaud to log you in. If you
    don't use the autologin feature, you can safely disable this.
  - accounts.google: This is a domain used by Google to log you in. If you
    don't use the autologin feature, you can safely disable this.

---

The source code for [this project][github] is available on github!

[Full changelog]: https://gavinmorrow.github.io/hunter-extension/CHANGELOG
[latest]: https://github.com/gavinmorrow/hunter-extension/releases/latest
[firefox]: https://github.com/gavinmorrow/hunter-extension/releases/download/v0.2.6/65a14653bc7c4e6ab617.xpi
[Mozilla help page]: https://support.mozilla.org/en-US/kb/how-update-add-ons
[github]: https://github.com/gavinmorrow/hunter-extension/
