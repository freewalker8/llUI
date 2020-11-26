// 表格列字段转换
export const highLightTransfer = (h, params, other = '') => {
  let value = other || params.row[params.column.property] || '';
  let type = Object.prototype.toString.call(value);
  let val = type === '[object Array]' ? value[0].ip : type === '[object Object]' ? value.ip : value;
  let template = val.toString().indexOf("<span style='color:red'>") > -1; // 全文检索，高亮

  return h('span', template ? { domProps: { innerHTML: val } } : [val]);
};

/**
 * 处理表格行的rowKey
 * @param {Object} row 行数据
 * @param {String | Function} rowKey 行数据的key
 * @returns {String} rowKey
 */
export const getRowIdentify = (row, rowKey) => {
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
