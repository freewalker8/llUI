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
 * 深度判断两个变量是否相等,支持Array|Object|Number|String|Boolean
 * @param {Array|Object|Number|String|Boolean} a 判断因子a
 * @param {Array|Object|Number|String|Boolean} b 判断因子b
 */
export const isValueEqual = function(a, b) {
  if (isArray(a) && isArray(b)) {
    for (let idx = 0, len = a.length; idx < len; idx++) {
      if (!isValueEqual(a[idx], b[idx])) {
        return false;
      }
    }
    return true;
  }

  if (isObject(a) && isObject(b)) {
    return Object.keys(a).every(key => {
      return isValueEqual(a[key], b[key]);
    });
  }

  return a === b;
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

  const rd =
    s4() +
    '_' +
    s4() +
    '_' +
    s4() +
    '_' +
    Date.now()
      .toString(16)
      .slice(-4);

  return rd;
};

/**
 * 表格列字段转换
 * @param {Function} h createElement
 * @param {Object} params
 * @param {String} other
 */
export const highLightTransfer = (h, params, other = '') => {
  let value = other || params.row[params.column.property] || '';
  let type = Object.prototype.toString.call(value);
  let val = type === '[object Array]' ? value[0].ip : type === '[object Object]' ? value.ip : value;
  let temp = val.toString().indexOf("<span style='color:red'>") > -1;

  return h('span', temp ? { domProps: { innerHTML: val } } : [val]);
};

export const getRowIdentity = (row, rowKey) => {
  if (typeof rowKey === 'string') {
    if (rowKey.indexOf('.') < 0) {
      return row[rowKey];
    }

    let key = rowKey.split('.');
    let current = row;

    for (let i = 0, len = key.length; i < len; i++) {
      current = current[key[i]];
    }

    return current;
  } else if (typeof rowKey === 'function') {
    return rowKey.call(null, row);
  }
};
