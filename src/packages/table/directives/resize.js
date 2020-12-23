import { debounce } from 'lodash-es';

function listenToggle(el, value, isListen = true) {
  let {
    fixHeight, // 修正系数，除了表格内容高度以外的其他表格元素的高度和
    minHeight, // 表格内容区最小高度
    instance
  } = value;
  let maxHeight; // 表格最大高度

  const tableContentEl = el.querySelector('.el-table__body-wrapper');

  if (!tableContentEl) {
    return;
  }

  _listen();

  // 表格列排序后重新绑定resize事件，组件销毁后取消监听排序事件
  isListen ? instance.$on('column-sorted', _listen) : instance.$off('column-sorted', _listen);

  function _listen() {
    const behavior = isListen ? 'addEventListener' : 'removeEventListener';
    tableContentEl.style['overflow-y'] = 'auto';

    window[behavior](
      'resize',
      debounce(() => {
        _resize();
      }, 50)
    );

    instance.$nextTick(() => { _resize(); });

    function _resize() {
      maxHeight = window.innerHeight - el.offsetTop - fixHeight;
      maxHeight = maxHeight > minHeight ? maxHeight : minHeight; // 设置了最小高度
      tableContentEl.style.maxHeight = maxHeight + 'px';
    }
  }
}

export default {
  bind(el, binding) {
    listenToggle(el, binding.value);
  },
  unbind(el, binding) {
    listenToggle(el, binding.value, false);
  }
}