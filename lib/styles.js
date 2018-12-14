'use strict';

const utils = require('./utils');
const colors = require('ansi-colors');

const styles = {
  default: colors.noop,

  /**
   * Modifiers
   */

  set inverse(custom) {
    this._inverse = custom;
  },
  get inverse() {
    return this._inverse || utils.inverse(this.primary);
  },

  set complement(custom) {
    this._complement = custom;
  },
  get complement() {
    return this._complement || utils.complement(this.primary);
  },

  /**
   * Main color
   */

  primary: colors.cyan,

  /**
   * Main palette
   */

  success: colors.green,
  danger: colors.magenta,
  strong: colors.bold,
  warning: colors.yellow,
  muted: colors.dim,
  disabled: colors.gray,
  dark: colors.dim.gray,
  underline: colors.underline,

  set info(custom) {
    this._info = custom;
  },
  get info() {
    return this._info || this.primary;
  },

  set em(custom) {
    this._em = custom;
  },
  get em() {
    return this._em || this.primary.underline;
  }
};

styles.merge = (options = {}) => {
  if (options.styles && typeof options.styles.enabled === 'boolean') {
    colors.enabled = options.styles.enabled;
  }
  if (options.styles && typeof options.styles.visible === 'boolean') {
    colors.visible = options.styles.visible;
  }

  let result = utils.merge({}, styles, options.styles);
  delete result.merge;

  for (let key of Object.keys(colors)) {
    if (!result.hasOwnProperty(key)) {
      Reflect.defineProperty(result, key, { get: () => colors[key] });
    }
  }

  for (let key of Object.keys(colors.styles)) {
    if (!result.hasOwnProperty(key)) {
      Reflect.defineProperty(result, key, { get: () => colors[key] });
    }
  }
  return result;
};

module.exports = styles;
