import { isFunction } from './util';

const hasOwnProperty = Object.prototype.hasOwnProperty;

function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key);
}

/**
 * 对对象的属性进行代理
 * @param {Object} dom 被代理对象
 * @param {Array<String>} properties 被代理对象的属性列表
 */
export const delegate = function(dom, properties) {
  properties.forEach(p => {
    if (!hasOwn(dom, p)) return;
    if (!dom[p]) return;
    if (this[p]) return;
    if (isFunction(dom[p])) {
      this[p] = function(...arg) {
        dom[p](...arg);
      };
    } else {
      this[p] = dom[p];
    }
  });
};
