
export const isFunction = function(val) {
  return Object.prototype.toString.call(val) === '[object Function]';
};

export const isObject = function(val) {
  return Object.prototype.toString.call(val) === '[object Object]';
};

export const isArray = function(val) {
  return Array.isArray ? Array.isArray(val) : Object.prototype.toString.call(val) === '[object Array]';
};

/**
 * 对象数组按对象的属性排序
 * @param {Array<Object>} arr 对象数组
 * @param {String} prop 排序的属性
 * @param {Enum(asc, desc)} order 排序方式，默认asc(正序)排列
 * @returns {Array<Object>} 排序后的数组
 */
export const sortObjectArrayByProp = (arr, prop = 'label', order = 'asc') => {
  return arr.sort((a, b) => {
    const aProp = a[prop];
    const bProp = b[prop];
    let flag = order === 'asc' ? 1 : -1;

    if (aProp > bProp) return flag;
    if (aProp < bProp) return -flag;
    return 0; // equal
  });
};

export const uuid = function() {
  function s4() {
    return Math.floor(65536 * Math.random()).toString(16);
  }

  const rd = s4() + '_' + s4() + '_' + s4() + '_' + Date.now().toString(16).slice(-4);

  return rd;
}