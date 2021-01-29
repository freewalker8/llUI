function listenToggle(el, value, isListen = true) {
  let {
    dragable = false, // 是否可拖动
    dragSelector, // 允许被拖动元素选择器
    excludeSelector, // 不允许被拖动元素选择器
    instance, // 组件实例
    splitor = '.', // label分隔符
    rebind = false // 是否重新绑定事件
  } = value;

  if (!dragable) {
    return;
  }

  let dragged = null;
  let draggableDoms = [];

  _listen();

  // 执行筛选操作后重新绑定拖动事件，组件销毁后取消监听拖动事件
  isListen ? instance.$on('column-filter', _listen) : instance.$off('column-filter', _listen);

  function _listen() {
    setTimeout(function() {
      const behavior = isListen ? 'addEventListener' : 'removeEventListener';
      draggableDoms = el.querySelector(dragSelector);

      for (const dDom of draggableDoms) {
        // 排除不可拖动元素
        if (
          excludeSelector &&
          excludeSelector.some(c => {
            return dDom.className.includes(c) || dDom.parentNode.className.includes(c);
          })
        ) {
          continue;
        }

        dDom.draggable = true;
        dDom.className = dDom.className + ' wst-table__sort-column--dragable';
        dDom[behavior]('dragstart', _handleDragStart);
        dDom[behavior]('dragover', _handleDragOver);
        dDom[behavior]('dragenter', _handleDragEnter);
        dDom[behavior]('dragleave', _handleDragLeave);
        dDom[behavior]('dragend', _handleDragEnd);
        dDom[behavior]('drop', _handleDrop);
      }
    }, 10);
  }

  function _handleDragStart(event) {
    dragged = event.target;
    dragged.style.opacity = 0.5;
    event.dataTransfer.effectAllowed = 'move';
    try {
      event.dataTransfer.setData('text/plain', '');
    } catch (e) {
      console.warn(e);
    }
  }

  function _handleDragOver(event) {
    event.dataTransfer.dropEffect = 'move';
    event.preventDefault();
  }

  function _handleDragEnter(event) {
    const target = event.target;
    if (target.draggable) {
      target.className = target.className + ' wst-table__sort-column--drop-over';
    }
  }

  function _handleDragLeave(event) {
    const target = event.target;
    if (target.draggable) {
      target.className = target.className.replace(' wst-table__sort-column--drop-over', '');
    }
  }

  function _handleDragEnd(event) {
    const target = event.target;
    event.preventDefault();
    target.style.opacity = '';
    event.dataTransfer.dropEffect = 'move';
  }

  function _handleDrop(event) {
    event.preventDefault();
    const target = event.target;
    if (target.draggable) {
      const targetIndex = _index(target);
      const draggedIndex = _index(dragged);

      target.className = target.className.replace(' wst-table__sort-column--drop-over', '');

      dragged.style.opacity = '';

      instance.$emit('column-sorted', __getSort(targetIndex, draggedIndex));

      // 直接拖动表格列改变列顺序后表格进行了重新渲染，导致绑定到列上的事件失效，所有需要重新绑定
      rebind &&
        instance.$nextTick(() => {
          _listen();
        });
    }

    /**
     * 获取排序信息
     * @param {Number} targetIndex 放置目标元素在可拖动元素中的索引
     * @param {Number} draggedIndex 被放置元素在可拖动元素中的索引
     * @returns {Array<String>} 排序后的列信息
     */
    function __getSort(targetIndex, draggedIndex) {
      const sorted = Array.from(draggableDoms).map(dom => {
        const labels = dom.innerText.split(splitor);
        return labels[1] || labels[0];
      });

      // 交换数组元素位置
      sorted[targetIndex] = [sorted[draggedIndex], (sorted[draggedIndex] = sorted[targetIndex])][0];

      return sorted;
    }
  }

  function _index(dom) {
    for (const [index, d] of draggableDoms.entries()) {
      if (dom.innerText === d.innerText) {
        return index;
      }
    }

    return -1;
  }
}

export default {
  bind(el, binding) {
    listenToggle(el, binding.value);
  },
  unbind(el, binding) {
    listenToggle(el, binding.value, false);
  }
};