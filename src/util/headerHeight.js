const getHeaderHeight = () => {
  const header = document.getElementById("site-header-parent-container");
  const subheadings = Array.from(header.children);
  const heights = subheadings.map(
    (subheading) => subheading.getBoundingClientRect().height,
  );
  const totalHeight = heights.reduce((x, acc) => x + acc, 0);

  return totalHeight;
};

const resizeHeaderSpacer = async () => {
  // set new height for spacer
  // the spacer determines the amount of space the full header takes up
  const spacerElem = await waitForElem("#site-top-spacer");
  if (spacerElem == null) return;
  spacerElem.style.height = `${getHeaderHeight()}px`;

  // The line height is set to be too big, extending the element too far down and blocking clicks
  const logo = await waitForElem("#site-logo");
  logo.style.lineHeight = "initial";
};
