const getHeaderHeight = () => {
  const header = document.getElementById("site-header-parent-container");
  const subheadings = Array.from(header.children);
  const heights = subheadings.map(
    subheading => subheading.getBoundingClientRect().height
  );
  const totalHeight = heights.reduce(
    (x, acc) => x + acc,
    0
  );

  return totalHeight;
}
