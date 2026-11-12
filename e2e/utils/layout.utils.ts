import { expect, type Locator } from '@playwright/test';

// An element is reachable when no ancestor that users cannot scroll (overflow hidden or clip)
// cuts it off, and, scrolled into view, its centre is the topmost element at that point (not
// covered by another element). scrollIntoView alone is not enough: it also scrolls
// overflow-hidden boxes, which a user cannot do.
export async function expectReachable(locator: Locator) {
  const clippedBy = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      const box = ancestor.getBoundingClientRect();
      const left = rect.left - box.left + ancestor.scrollLeft;
      const top = rect.top - box.top + ancestor.scrollTop;
      const clipsX = ['hidden', 'clip'].includes(style.overflowX) && (left < 0 || left + rect.width / 2 > ancestor.clientWidth);
      const clipsY = ['hidden', 'clip'].includes(style.overflowY) && (top < 0 || top + rect.height / 2 > ancestor.clientHeight);
      if (clipsX || clipsY) return ancestor.getAttribute('data-testid') ?? ancestor.tagName.toLowerCase();
    }
    return null;
  });
  expect(clippedBy, `${locator} is not clipped by an ancestor`).toBeNull();
  await locator.scrollIntoViewIfNeeded();
  const hit = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const inViewport = x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight;
    const top = inViewport ? document.elementFromPoint(x, y) : null;
    return { inViewport, onTop: !!top && (top === element || element.contains(top)) };
  });
  expect(hit, `${locator} is reachable`).toEqual({ inViewport: true, onTop: true });
}

// The element's right edge stays inside its container's right edge.
export async function expectContainedIn(element: Locator, container: Locator) {
  const [inner, outer] = await Promise.all([element.boundingBox(), container.boundingBox()]);
  expect(inner, `${element} is rendered`).not.toBeNull();
  expect(outer, `${container} is rendered`).not.toBeNull();
  expect(inner!.x + inner!.width, `${element} ends inside ${container}`).toBeLessThanOrEqual(outer!.x + outer!.width + 1);
}

export async function expectNoHorizontalPageOverflow(locator: Locator) {
  const overflow = await locator.page().evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'horizontal page overflow in px').toBeLessThanOrEqual(1);
}
