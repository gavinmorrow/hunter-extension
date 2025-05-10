# Changelog

## v0.4.5

_released 10 May 2025_

- Bug Fixes:
  - When using Chrome, Prevent assignment popup from closing when text is
    selected inside of it.

## v0.4.4

_released 07 May 2025_

- Features:
  - There's a cute little icon now!

## v0.4.3

_released 07 May 2025_

- Bug Fixes:
  - Prevent what's new and notify update from failing on Chrome.

## v0.4.2

_released 07 May 2025_

- Bug Fixes:
  - Make the page automatically reload when Orion is updated, instead of
    erroring.
  - Fix some links that still pointed to the old github repo.

## v0.4.1

_released 07 May 2025_

I finally came up with a somewhat-halfway-decent name: Orion. Also, I'm finally
putting this thing on the chrome web store.

## v0.4.0

_released 06 May 2025_

This release doesn't have too many new features, but I decided to bump it
anyways because I finally got the what's new stuff (incl. banners!) out the door
and why not. It's been a while since I've actually added a new feature.

- Features:
  - A banner will show after the extension updates.
  - Use banners for error reporting instead of popups.
    - Add option to email me the details of the error.
  - Show a banner when an update is released.
- Bug Fixes:
  - Remove the title text when hovering over an assignment link, as it is
    completely redundant and displayed raw HTML.

## v0.3.4

_released 09 April 2025_

- Features:
  - Prevent assignment popup from closing when text is selected inside of it.
- Bug Fixes:
  - Fix issue where Blackbaud changed a URL format for the student user id.

## v0.3.3

_released 18 March 2025_

- Bug Fixes:
  - Fully fix the assignment collapsing issue.

## v0.3.2

_released 18 March 2025_

- Features:
  - Add version text in toolbar.
  - Make tasks due on the next weekday. (ie if you create a task on Friday or
    over the weekend, it will \[by default] be due the following Monday.)
- Bug fixes:
  - Fully collapse assignments to one line when marking as done. (There was a
    problem with line breaks not collapsing before.)
  - Fix the Dark Reader extension overriding the colors in the task editor save
    button and making them look really bad.
    - btw, I highly recommend it! it forces sites into dark mode.
      <https://darkreader.org/>
  - Make toolbar wrap when the screen is too narrow rather than squish.

## v0.3.1

_released 28 February 2025_

- Features:
  - Add a button to open the changelog (this document) to the toolbar.
- Bug Fixes:
  - Fix the colors of some classes not displaying.

## v0.3.0

_released 23 February 2025_

(I decided to bump to v0.3 b/c I did a lot of work on the assignments loading
and it felt like it deserved a minor release and not a patch release.)

- Bug Fixes/Improvements:
  - Fix performance of loading assignments. This required a complete overhaul
    of the assignment loading system, so if there are any bugs please tell me!
  - Past assignments show up again!
  - Prevent the window from jittering up and down rapidly.
  - Calculate the header size from a different source so it is always correct.
  - Adjust the header spacer on window resize so it always remains correct.
  - Increase the timeout for google autologin, so it hopefully won't get stuck
    in a loop. (From 0.5sec -> 1sec. It shouldn't be very noticeable.)
- Known problems:
  - The colors of some classes are missing. This is because for some reason
    they're not included in the API response. I have a plan to fix it, I just
    don't want to delay this release any further.

## v0.2.10

_released 03 February 2025_

- **IMPORTANT:**
  - Performance of Blackbaud has gotten really bad, and the solution isn't done
    yet. In the meantime, **_past assignments will not be displayed._**
- Improvements:
  - Make action buttons (eg `Mark as Completed`) stretch horizontally to fill.
  - Make buttons and input fields inside of the custom UI dark themed.
  - Show attached links in the attachments section in the assignment popup.

## v0.2.9

_released 09 January 2025_

- Bug Fixes:
  - Don't show the whats new beta.

## v0.2.8

_released 09 January 2025_

- Bug Fixes:
  - Fix class name sometimes being the number of points.
  - Wrap long assignment titles (instead of overflow).
  - Remove extra files (.git, etc) from being included in Chrome release zip.

## v0.2.7

_released 18 December 2024_

- Features:
  - Report Blackbaud API failures when they happen, and don't completely crash.

## v0.2.6

_released 10 December 2024_

- Bug Fixes:
  - Custom UI is now fixed after being completely broken by Blackbaud API
    changes.

## v0.2.5

_released 17 November 2024_

- Features:
  - Downloads/attachments are shown in the assignment popup.
  - The name of the class is shown at the bottom of the assignment popup.
- Bug Fixes:
  - Assignments now have a total sort order (ie when you create a new task, it
    won't switch positions in the list after a reload. this is _very_ minor but
    was bothering me.)

## v0.2.4

_released 11 November 2024_

- Bug Fixes:
  - Fixes google autologin sometimes getting stuck in a loop.
  - Fixes Saturday assignments not displaying correctly.
  - Fixes weekends not displaying when a task is assigned to them.

## v0.2.3

_released 07 November 2024_

- Features:
  - Supports Google Assignments as an LTI provider. This doesn't actually change
    any functionality, but means that it will say "Submit on Google Assignments"
    instead of just "Submit".
- Bug Fixes:
  - Fixes task support being so buggy to the point of being unusable. I rushed
    it out and didn't test it enough, sorry. Tell me if I missed anything!
  - Fixes google autologin not always working.
  - Prevents styling from breaking when the Dark Reader extension is used.

## v0.2.2

_released 21 October 2024_

- Features:
  - You can now create and edit custom tasks!
  - Adds a central toolbar for actions (settings, toggle custom ui, new task)
- Bug Fixes:
  - Fixes a bug where sometimes Blackbaud autologin wouldn't work.

## v0.2.0

_released 19 October 2024_

- Features:
  - 🎆 **Custom tasks are now supported!!!** 🎉 If you find any bugs with them,
    please report them to me asap.
- Bug Fixes:
  - Don't crash if there's an assignment marked as extra credit.

## v0.1.5

_released 15 October 2024_

- Features:
  - Indicators when online submission is required (blue border + submit button)
- Bug Fixes:
  - Actually respect the `assignmentCenter.enabled` setting.
- Styling Changes:
  - Dates have padding (fa2faa1)
  - Fix some glitches with corners and border radii.

Next release there will be custom task support!
