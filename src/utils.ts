/**
 * @author Jay Wang
 * @email jay@zijie.wang
 * @license MIT
 */

import { randomLcg, randomUniform } from 'd3-random';
import {
  computePosition,
  flip,
  shift,
  offset,
  arrow,
  hide
} from '@floating-ui/dom';

export interface TooltipConfig {
  tooltipElement: HTMLElement;
  mouseenterTimer: number | null;
  mouseleaveTimer: number | null;
}

// import type { SvelteComponent } from 'svelte';

/**
 * Round a number to a given decimal.
 * @param {number} num Number to round
 * @param {number} decimal Decimal place
 * @returns number
 */
export const round = (num: number, decimal: number) => {
  return Math.round((num + Number.EPSILON) * 10 ** decimal) / 10 ** decimal;
};

/**
 * Get a random number between [min, max], inclusive
 * @param {number} min Min value
 * @param {number} max Max value
 * @returns number
 */
export const random = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

/**
 * Download a JSON file
 * @param {any} object
 * @param {HTMLElement | null} [dlAnchorElem]
 * @param {string} [fileName]
 */

export const downloadJSON = (
  object: object,
  dlAnchorElem: HTMLElement | null = null,
  fileName = 'download.json'
) => {
  const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(object));

  // Create dlAnchor if it is not given
  let myDlAnchorElem = dlAnchorElem;
  let needToRemoveAnchor = false;

  if (dlAnchorElem === null) {
    myDlAnchorElem = document.createElement('a');
    myDlAnchorElem.classList.add('download-anchor');
    myDlAnchorElem.style.display = 'none';
    needToRemoveAnchor = true;
  }

  myDlAnchorElem?.setAttribute('href', dataStr);
  myDlAnchorElem?.setAttribute('download', `${fileName}`);
  myDlAnchorElem?.click();

  if (needToRemoveAnchor) {
    myDlAnchorElem?.remove();
  }
};

/**
 * Download a text file
 * @param {string} textString
 * @param {HTMLElement | null} [dlAnchorElem]
 * @param {string} [fileName]
 */

export const downloadText = (
  textString: string,
  dlAnchorElem: HTMLElement | null,
  fileName = 'download.json'
) => {
  const dataStr =
    'data:text/plain;charset=utf-8,' + encodeURIComponent(textString);

  // Create dlAnchor if it is not given
  let myDlAnchorElem = dlAnchorElem;
  let needToRemoveAnchor = false;

  if (dlAnchorElem === null) {
    myDlAnchorElem = document.createElement('a');
    myDlAnchorElem.style.display = 'none';
    needToRemoveAnchor = true;
  }

  myDlAnchorElem?.setAttribute('href', dataStr);
  myDlAnchorElem?.setAttribute('download', `${fileName}`);
  myDlAnchorElem?.click();

  if (needToRemoveAnchor) {
    myDlAnchorElem?.remove();
  }
};

/**
 * Compute the luminance of a RGB color
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 * @param color [R, G, B in 0..255]
 * @returns number
 */

export const getLuminance = (color: number[]) => {
  const r = color[0];
  const g = color[1];
  const b = color[2];

  // Some strange required transformations
  const transformedRGB = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return (
    transformedRGB[0] * 0.2126 +
    transformedRGB[1] * 0.7152 +
    transformedRGB[2] * 0.0722
  );
};

/**
 * Compute color contrast ratio
 * @param color1 [r, g, b] in 255 scale
 * @param color2 [r, g, b] in 255 scale
 * @returns Contrast ratio
 */

export const getContrastRatio = (color1: number[], color2: number[]) => {
  const color1L = getLuminance(color1);
  const color2L = getLuminance(color2);
  const ratio =
    color1L > color2L
      ? (color2L + 0.05) / (color1L + 0.05)
      : (color1L + 0.05) / (color2L + 0.05);
  return ratio;
};

/**
 * Check if two colors have enough contrast
 * @param color1 [r, g, b] in 255 scale
 * @param color2 [r, g, b] in 255 scale
 * @param condition 'AA' or 'AAA'
 * @param smallText If it is small text
 * @returns If two colors have enough contrast
 */

export const haveContrast = (
  color1: number[],
  color2: number[],
  condition = 'AAA',
  smallText = true
) => {
  const ratio = getContrastRatio(color1, color2);

  // Compare the ratio with different thresholds
  if (condition === 'AA') {
    if (smallText) {
      return ratio <= 1 / 4.5;
    } else {
      return ratio <= 1 / 3;
    }
  } else {
    if (smallText) {
      return ratio <= 1 / 7;
    } else {
      return ratio <= 1 / 4.5;
    }
  }
};

/**
 * Check if two sets are the same
 * @param set1 Set 1
 * @param set2 Set 2
 */
export const setsAreEqual = <T>(set1: Set<T>, set2: Set<T>): boolean => {
  return set1.size === set2.size && [...set1].every(d => set2.has(d));
};

/**
 * Get the file name and file extension from a File object
 * @param {File} file File object
 * @returns [file name, file extension]
 */

export const splitFileName = (file: File) => {
  const name = file.name;
  const lastDot = name.lastIndexOf('.');
  const value = name.slice(0, lastDot);
  const extension = name.slice(lastDot + 1);
  return [value, extension];
};

/**
 * Split the reader stream text by a string
 * @param sep String used to separate the input string
 * @returns TransformStream
 */
export const splitStreamTransform = (sep: string) => {
  let buffer = '';

  const transform = new TransformStream({
    transform: (chunk, controller) => {
      buffer += chunk;
      const parts = buffer.split(sep);
      parts.slice(0, -1).forEach(part => controller.enqueue(part));
      buffer = parts[parts.length - 1];
    },
    flush: controller => {
      if (buffer) {
        controller.enqueue(buffer);
      }
    }
  });

  return transform;
};

/**
 * Parse the input stream as JSON
 * @returns TransformStream
 */
export const parseJSONTransform = () => {
  const transform = new TransformStream({
    transform: (chunk, controller) => {
      controller.enqueue(JSON.parse(chunk as string));
    }
  });
  return transform;
};

const timeitQueue = new Set();
/**
 * Trace the execution time
 * @param label Label for the time tracer
 * @param show Whether to printout the output in console
 */
export const timeit = (label: string, show: boolean) => {
  if (show) {
    if (timeitQueue.has(label)) {
      console.timeEnd(label);
      timeitQueue.delete(label);
    } else {
      console.time(label);
      timeitQueue.add(label);
    }
  }
};

/**
 * Convert a color from rgb to hex
 * @param r Value in the red channel
 * @param g Value in the green channel
 * @param b Value in the blue channel
 * @returns Hex string
 */
export const rgbToHex = (r: number, g: number, b: number) => {
  const numToHex = (number: number) => {
    const hex = number.toString(16);
    if (hex.length == 1) {
      return `0${hex}`;
    } else {
      return hex;
    }
  };
  return `#${numToHex(r)}${numToHex(g)}${numToHex(b)}`;
};

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Detect if two rectangles overlap.
 * https://stackoverflow.com/a/306332
 *
 * @param rect1 Rectangle 1
 * @param rect2 Rectangle 2
 * @returns True if these two rectangles overlap.
 */
export const rectsIntersect = (rect1: Rect, rect2: Rect) => {
  const right1 = rect1.x + rect1.width;
  const right2 = rect2.x + rect2.width;

  const bottom1 = rect1.y + rect1.height;
  const bottom2 = rect2.y + rect2.height;

  return (
    rect1.x < right2 &&
    right1 > rect2.x &&
    rect1.y < bottom2 &&
    bottom1 > rect2.y
  );
};

/**
 * Get a uniformly random sample from a list.
 * @param items Array of items to sample from
 * @param size Target size of the sample
 * @param seed Random seed (default to 1212)
 * @param replace True if sample with replace
 * @returns Sampled items
 */
export const getRandomSamples = <T>(
  items: Array<T>,
  size: number,
  seed = 1212,
  replace = false
) => {
  const targetSize = Math.min(size, items.length);
  const threshold = targetSize / items.length;
  const myRandomUniform = randomUniform.source(randomLcg(seed))(0, 1);

  const sampledItems: Array<T> = [];
  const sampledIndexes: Set<number> = new Set();

  // Repeat sampling until we have enough points sampled
  while (sampledItems.length < targetSize) {
    for (const [i, item] of items.entries()) {
      if (
        (replace || !sampledIndexes.has(i)) &&
        myRandomUniform() <= threshold
      ) {
        sampledIndexes.add(i);
        sampledItems.push(item);

        // Exit early if we have enough points
        if (sampledItems.length >= targetSize) break;
      }
    }
  }

  return sampledItems;
};

/**
 * A helper function to break up a long function into multiple tasks
 * https://web.dev/optimize-long-tasks/
 * @returns A promise equivalent to sleep(0)
 */
export const yieldToMain = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
};

/**
 * A helper function for sleep()
 * @returns A promise that resolves in n ms
 */
export const sleep = (n: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, n);
  });
};

/**
 * Update the popper tooltip for the highlighted prompt point
 * @param tooltip Tooltip element
 * @param anchor Anchor point for the tooltip
 * @param point The prompt point
 */
export const updatePopperTooltip = (
  tooltip: HTMLElement,
  anchor: HTMLElement,
  text: string,
  placement: 'bottom' | 'left' | 'top' | 'right',
  withArrow: boolean,
  offsetAmount = 8
) => {
  const contentElement = tooltip.querySelector(
    '.popper-content'
  )! as HTMLElement;
  contentElement.innerHTML = text;
  const arrowElement = tooltip.querySelector('.popper-arrow')! as HTMLElement;

  if (withArrow) {
    arrowElement.classList.remove('hidden');
    computePosition(anchor, tooltip, {
      placement: placement,
      middleware: [
        offset(offsetAmount),
        flip(),
        shift(),
        arrow({ element: arrowElement }),
        hide()
      ]
    }).then(({ x, y, placement, middlewareData }) => {
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;

      const { x: arrowX, y: arrowY } = middlewareData.arrow!;
      let staticSide: 'bottom' | 'left' | 'top' | 'right' = 'bottom';
      if (placement.includes('top')) staticSide = 'bottom';
      if (placement.includes('right')) staticSide = 'left';
      if (placement.includes('bottom')) staticSide = 'top';
      if (placement.includes('left')) staticSide = 'right';

      arrowElement.style.left = arrowX ? `${arrowX}px` : '';
      arrowElement.style.top = arrowY ? `${arrowY}px` : '';
      arrowElement.style.right = '';
      arrowElement.style.bottom = '';
      arrowElement.style[staticSide] = '-4px';

      if (middlewareData.hide?.referenceHidden) {
        tooltip.classList.add('hidden');
      } else {
        tooltip.classList.remove('hidden');
      }
    });
  } else {
    arrowElement.classList.add('hidden');
    computePosition(anchor, tooltip, {
      placement: placement,
      middleware: [offset(6), flip(), shift(), hide()]
    }).then(({ x, y, middlewareData }) => {
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;

      if (middlewareData.hide?.referenceHidden) {
        tooltip.classList.add('hidden');
      } else {
        tooltip.classList.remove('hidden');
      }
    });
  }
};

/**
 * Show a tooltip
 * @param e Trigger event
 * @param name The tooltip content
 * @param position Tooltip position
 * @param tooltip Tooltip config
 * @param delay Display animation delay
 * @param target If set, use it as the tooltip target
 */
export const tooltipMouseEnter = (
  e: Event,
  name: string,
  position: 'bottom' | 'left' | 'top' | 'right',
  tooltip: TooltipConfig | null,
  delay = 500,
  target: HTMLElement | undefined = undefined,
  offsetAmount = 8
) => {
  let curTarget: HTMLElement;

  if (target !== undefined) {
    curTarget = target;
  } else {
    curTarget = e.currentTarget as HTMLElement;
  }

  if (tooltip) {
    if (tooltip.tooltipElement.classList.contains('hidden')) {
      if (tooltip.mouseenterTimer !== null) {
        clearTimeout(tooltip.mouseenterTimer);
        tooltip.mouseenterTimer = null;
      }

      tooltip.mouseenterTimer = setTimeout(() => {
        updatePopperTooltip(
          tooltip!.tooltipElement,
          curTarget,
          name,
          position,
          true,
          offsetAmount
        );

        tooltip!.tooltipElement.classList.remove('hidden');
        tooltip!.mouseenterTimer = null;
      }, delay);
    } else {
      if (tooltip.mouseleaveTimer !== null) {
        clearTimeout(tooltip.mouseleaveTimer);
        tooltip.mouseleaveTimer = null;
      }

      updatePopperTooltip(
        tooltip!.tooltipElement,
        curTarget,
        name,
        position,
        true,
        offsetAmount
      );
    }
  }
};

/**
 * Hide a tooltip
 * @param tooltip Tooltip config
 * @param delay Delay to hide the tooltip
 */
export const tooltipMouseLeave = (
  tooltip: TooltipConfig | null,
  delay = 500
) => {
  if (tooltip) {
    if (tooltip.mouseenterTimer !== null) {
      clearTimeout(tooltip.mouseenterTimer);
      tooltip.mouseenterTimer = null;
    }

    if (tooltip.mouseleaveTimer !== null) {
      clearTimeout(tooltip.mouseleaveTimer);
      tooltip.mouseleaveTimer = null;
    }

    tooltip.mouseleaveTimer = setTimeout(() => {
      tooltip!.tooltipElement.classList.add('hidden');
      tooltip!.mouseleaveTimer = null;
    }, delay);
  }
};

/**
 * Calculate the Levenshtein distance (edit distance) between two strings
 * @param str1 String 1
 * @param str2 String 2
 * @returns Edit distance between two strings
 */
export const calculateLevenshteinDistance = (
  str1: string,
  str2: string
): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = [];

  // Initialize the dp matrix
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Calculate the minimum operations
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // Deletion
          dp[i][j - 1] + 1, // Insertion
          dp[i - 1][j - 1] + 1 // Substitution
        );
      }
    }
  }

  return dp[m][n];
};

/**
 * Calculate the number of common words between two strings
 * @param str1 String 1
 * @param str2 String 2
 * @returns Number of common words
 */
export const getNumCommonWords = (str1: string, str2: string) => {
  const words1 = str1.toLocaleLowerCase().split(' ');
  const words2 = new Set(str2.toLocaleLowerCase().split(' '));
  return words1.filter(w => words2.has(w)).length;
};

/**
 * Splits an array into chunks of a specified size.
 *
 * @template T - The type of elements in the array.
 * @param {T[]} array - The array to be split into chunks.
 * @param {number} size - The size of each chunk.
 * @returns {T[][]} - An array of chunks, where each chunk is an array of size `size`.
 * @throws {Error} - If `size` is less than or equal to 0.
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  if (size <= 0) throw new Error('Size must be greater than 0');

  const result: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }

  return result;
};
