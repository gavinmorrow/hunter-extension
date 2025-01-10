# Changelog

## v0.2.8

_released 00 December 2024_

- Bug Fixes:
  - Fix class name sometimes being the number of points.
  - Wrap long assignment titles (instead of overflow).

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
