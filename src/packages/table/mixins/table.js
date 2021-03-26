import { delegate } from 'utils/vDom';
import { getRowIdentity, highLightTransfer, sortObjectArrayByProp } from 'utils/util';
import Render from 'utils/render';
import columnFilter from './columnFilter';
import actionColumn from './actionColumn';
import dragable from '../directives/dragable';
import resize from '../directives/resize';

import '../style/index.scss';

const DefaultPaginationProps = {
  pageSizes: [5, 10, 20, 50, 100],
  layout: 'slot, ->, total, sizes, prev, pager, next, jumper'
};

export default {
  inheritAttrs: false, // 未被识别为props的属性，将不会出现在根元素上
  components: { Render },
  mixins: [columnFilter, actionColumn],
  props: {
    layout: {
      type: String,
      default: 'tool, table, extra, pagination'
    },
    data: {
      type: Array,
      default() {
        return [];
      }
    },
    columns: {
      type: Array,
      default: () => []
    },
    rowKey: {
      type: [String, Function],
      default: 'id'
    },
    // 是否可拖动排序
    dragSortable: {
      type: Boolean,
      default: false
    },
    // 拖动模式，可选表头模式（拖动表头排序）和过滤表单item拖动模式（在列过滤表单里面拖动列item进行排序）
    dragSortMode: {
      type: String,
      default: 'thead',
      validator(val) {
        return ['thead', 'formItem'].includes(val);
      }
    },
    // 默认选中的行，table-column的type属性值为selection时生效
    selection: {
      type: Array,
      default() {
        return [];
      }
    },
    // 是否可分页
    pageable: {
      type: Boolean,
      default: true
    },
    currentPage: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 10
    },
    paginationProps: {
      type: Object,
      default() {
        return {};
      }
    },
    customTableClass: String,
    // 是否响应浏览器窗口大小改变以便改变表格内容区高度
    autoHeight: {
      type: Boolean,
      default: true
    },
    // 表格内容区最小高度
    minHeight: {
      type: Number,
      default: 100
    },
    // 表格内容区高度的修正系数
    fixHeight: {
      type: Number,
      default: 100
    }
  },
  directives: {
    dragable,
    resize
  },
  data() {
    return {
      baseOrder: 100, // 未显示设置表格列的order属性时，表格列order属性的基础值
      columnCounter: 0, // 记录总共有多少列
      allColumns: [], // 所有一级列，多级表头时，下面的列没记入其中，而是属于一级列的子列
      tableColumns: [], // 渲染表格的列的数据
      canFilterColumns: [], // 可过滤的列，用于展示到过滤表单
      innerCurrentPage: 1,
      innerPageSize: 10,
      innerPaginationProps: {},
      // 表格状态相关参数
      innerSelection: [], // 选中的行的row-key组成的数组
      innerSelectionData: [] // 选中行的行数据组成的数组
    };
  },
  computed: {
    layouts() {
      return this.layout.split(',').map(item => item.trim());
    },
    paginationShow() {
      return this.pageable && this.layouts.includes('pagination');
    },
    toolBarShow() {
      return this.layouts.includes('tool') && this.$scopedSlots.tool;
    },
    extraShow() {
      return this.layouts.includes('extra') && this.$slots.extra;
    },
    // 开启列过滤时合并过滤列和倒数第二列时倒数第二列的index（index从0开始）
    colspanColumnFix() {
      return this.showActionColumn ? this.columnCounter : this.columnCounter - 1;
    }
  },
  watch: {
    columns: {
      deep: true,
      handler() {
        this._initTable();
        this.$emit('column-filter'); // 修改了列信息，触发下列筛选事件，从而触发重新绑定拖动事件
      }
    },
    allColumns: {
      deep: true,
      handler(columns) {
        this.tableColumns = []; // 清空，触发更新
        this.$nextTick(() => {
          this.tableColumns = this.checkedColumns.length
            ? columns.filter(({ prop, type }) => {
                // 被选中的列和索引选择列（有type属性的列）进行展示
                return this.checkedColumns.includes(prop) || !!type;
              })
            : columns;
          // bugfix:修复el-talbe的default-sort失效的问题
          // reason：这里设置了表格列后会进行表格渲染，渲染未完成时default-sort不会生效，el-talbe的源码里面就是在渲染完成后触发的排序
          let defaultSort;
          (defaultSort = this.$attrs['default-sort']) &&
            this.$nextTick(() => {
              const el = this.getTableRef();
              const { prop, order } = defaultSort;
              const init = true;
              el.store.commit('sort', { prop, order, init });
            });
        });
      }
    },
    // make innerCurrentPage and innerPageSize as data,
    // and watch currentPage to update innerCurrentPage, pageSize to update innerPageSize
    // at the same time watch innerCurrentPage and innerPageSize to emit sync emit.
    // the two watch cannot be replaced by computed getter and setter here,
    // because currentPage and pageSize can be not provided(undefined).
    pageSize: {
      immediate: true,
      handler(val) {
        this.innerPageSize = val;
      }
    },
    innerPageSize(newVal, oldVal) {
      this.$nextTick(() => {
        this.innerPageSize = newVal;
        if (oldVal !== newVal) {
          this.$emit('update:pageSize', newVal);
          this.$emit('size-change', this.innerPageSize);
          this.$emit('pagination-change', {
            pageSize: this.innerPageSize,
            currentPage: this.internalCurrentPage
          });
        }
      });
    },
    currentPage: {
      immediate: true,
      handler(val) {
        this.innerCurrentPage = val;
      }
    },
    innerCurrentPage(newVal, oldVal) {
      this.$nextTick(() => {
        if (oldVal !== newVal) {
          this.$emit('update:currentPage', newVal);
          this.$emit('current-page-change', newVal);
          this.$emit('pagination-change', {
            pageSize: this.innerPageSize,
            currentPage: newVal
          });
        }
      });
    },
    paginationProps: {
      immediate: true,
      handler(val) {
        if (this.paginationShow) {
          this.innerPaginationProps = Object.assign({}, DefaultPaginationProps, val);

          if (!this.innerPaginationProps.pageSizes.includes(this.innerPageSize)) {
            console.warn(
              `[ll-table]: pageSize ${this.innerPageSize} is not included in pageSizes[${this.innerPaginationProps.pageSizes}], set pageSize to pageSizes[0]: ${this.innerPaginationProps.pageSizes[0]}`
            );
            this.innerPageSize = this.innerPaginationProps.pageSizes[0];
          }
        } else {
          this.innerPageSize = this.curTableData.length;
        }
      }
    },
    selection: {
      deep: true,
      immediate: true,
      handler(val) {
        if (!val.length) return;
        this.$nextTick(() => {
          this.innerSelection = [...val];
          this._checkRows(val);
        });
      }
    },
    curTableData(val) {
      if (!val.length) return;
      if (this.selection.length) {
        this.$nextTick(() => {
          this._checkRows(this.selection);
        });
      }
    }
  },
  created() {
    // 获取表格列信息和可过滤列的信息
    this._initTable();

    // 订阅拖动排序
    this.dragSortable &&
      this.$on('column-sorted', data => {
        this._hanlderDragSort(data);
      });
  },
  mounted() {
    delegate.call(this, this.getTableRef(), [
      'clearSelection',
      'toggleRowSelection',
      'toggleAllSelection',
      'toggleRowExpansion',
      'setCurrentRow',
      'clearSort',
      'clearFilter',
      'doLayout',
      'sort'
    ]);
  },
  beforeDestroy() {
    this.dragSortable && this.$off('column-sorted');
  },
  methods: {
    /**
     * @public
     * 获取组件使用的el-table的ref
     */
    getTableRef() {
      return this.$refs.elTable;
    },
    /**
     * @public
     * 获取组件使用的el-pagination的ref
     */
    getPaginationRef() {
      return this.$refs.elPagination;
    },
    /**
     * 重置表格
     * 如果有自定义的工具栏则需要自己先清除搜索条件
     */
    _resetTable() {
      const selection = this.$props['selection'];
      this.innerCurrentPage = 1;
      this.innerPageSize = this.pageSize || 10;

      this.clearFilter();
      !this.$attrs['default-sort'] && this.clearSort(); // 未设置默认排序时才清除排序
      !selection.length ? this.clearSelection() : this._checkRows(selection); // 未设置默认选中行时才清除行选中，否则标记需要默认选中的行
    },
    // 获取表格列信息和可过滤列的信息
    _initTable() {
      // 获取表格需要展示的列的信息
      this.allColumns = this._collectColumns();
      // 获取可以进行过滤的列的信息
      this.canFilterColumns = this.allColumns.filter(({ label }) => label && label.trim()); // 含有label且不为空的才能筛选
    },
    /**
     * 收集通过columns定义的和通过el-table-column定义的列
     */
    _collectColumns() {
      const { columns = [], $slots } = this;
      const templateColumns = ($slots.default || [])
        .filter(column => column.componentOptions && column.componentOptions.tag === 'el-table-column')
        .map(column => {
          const { componentOptions, data } = column;
          const { propsData, children } = componentOptions;
          const { attrs = {}, scopedSlots = {}, on = {}, onNative = {} } = data;

          !children && this.columnCounter++;
          return {
            ...propsData,
            ...attrs,
            scopedSlots,
            on,
            onNative,
            children: this._getChildren(children) // 子节点
          };
        });

      const allColumns = [...templateColumns, ...columns].map(_c => {
        const c = _c;
        const { type, children } = c;
        if (c.order === undefined) {
          if (type) {
            c['label-class-name'] = 'wst-table__type-column';
            // 类型列（selection|index|expand）未设置order时总是排在前面
            c.order = ++this.baseOrder - 100000;
          } else {
            c.order = ++this.baseOrder;
          }
        }
        children ? this._columnMountCalc(children) : this.columnCounter++;

        return c;
      });

      const hasEmpty = allColumns.some(item => !item.prop && !item.type);
      hasEmpty &&
        this.columnFilterable &&
        console.warn('[wst-table]: unique prop is required when columnFilterable is enabled');

      return sortObjectArrayByProp(allColumns, 'order');
    },
    /**
     * 多级表头模式，获取多级列的子列信息
     * @param {Array<Object>} chds 子列信息
     */
    _getChildren(chds) {
      const collectChd = [];
      if (chds) {
        for (const c of chds) {
          const { componentOptions, data = { attrs: {} } } = c;
          const { propsData, children, tag } = componentOptions;
          if (children && tag === 'el-table-column') {
            collectChd.push({
              ...propsData,
              ...data.attrs,
              children: this._getChildren(children)
            });
          } else {
            collectChd.push({ ...propsData, ...data.attrs });
          }
        }
      }
    },
    /**
     * 统计表格列数量
     * @param {Array<Object>} chds 一级表格列
     */
    _columnMountCalc(chds) {
      for (const c of chds) {
        const { children } = c;
        children && children.length ? this._columnMountCalc(children) : this.columnCounter++;
      }
    },
    // 合并行列
    _spanMethod(scope) {
      let { columnIndex } = scope;
      const userSpanMethod = this.$attrs['span-method'];

      // 用户传入的合并行列方法
      if (userSpanMethod) {
        return userSpanMethod(scope);
      }

      // 表格可过滤时合并倒数第二列和过滤列（最后一列）
      else if (this.columnFilterable && columnIndex === this.colspanColumnFix) {
        return {
          colspan: 2,
          rowspan: 1
        };
      }
    },
    _handleSizeChange(size) {
      this.innerPageSize = size;
    },
    _handlePrevClick(page) {
      this.$emit('prev-click', page);
    },
    _handleNextClick(page) {
      this.$emit('next-click', page);
    },
    _handleCurrentChange(page) {
      this.innerCurrentPage = page;
    },
    /**
     * 对表格选中行数据进行拦截，处理表格选中状态变化
     * @param {Array<Object>} arr 选中的表格行数据组成的数组
     */
    _handleSelectionChange(arr) {
      this.innerSelectionData = arr;
      this.innerSelection = arr.map(row => getRowIdentity(row, this.rowKey));
      this.$emit('selection-change', arr);
    },
    /**
     * 选中表格数据
     * @param {Array<String>} val 待选中数据的rowKey组成的数组
     */
    _checkRows(val) {
      // 标记选中项
      this.curTableData.forEach(row => {
        const key = getRowIdentity(row, this.rowKey);
        this.toggleRowSelection(row, val.includes(key));
      });
    },
    /**
     * 处理拖动排序，更新列表信息
     * @param {Array<String>} sortedData 列顺序，由列label信息组成
     */
    _handleDragSort(sortedData) {
      const allColumns = this.allColumns;
      allColumns.map(column => {
        sortedData.map((label, index) => {
          label === column.label && (column.order = index);
        });
      });

      sortObjectArrayByProp(allColumns, 'order');

      this.$emit('column-sort-change', allColumns, sortedData);
    },
    _headerCellStyle(scope) {
      const { columnIndex } = scope;
      const userHeaderCellStyle = this.$attrs['header-cell-style'];

      if (userHeaderCellStyle) {
        return userHeaderCellStyle(scope);
      }
      // 取消倒数第二列的有边框
      else if (
        this.columnFilterable &&
        this.$attrs['border'] !== undefined &&
        columnIndex === this.colspanColumnFix
      ) {
        return {
          'border-right': 'none'
        };
      }
    },
    _renderTool() {
      return this.toolBarShow ? (
        <div class='wst-table__toolBar'>
          {this.$scopedSlots['tool']({
            selection: this.innerSelection,
            selectionData: this.innerSelectionData,
            params: this.innerParams || {}
          })}
        </div>
      ) : null;
    },
    _renderTable() {
      /**
       * 渲染列函数
       * @param {Object} propsData 列属性对象
       * @param {Boolean} hasChildren 是否是多级表头的子列
       */
      const _renderColumn = (propsData, hasChildren = false) => {
        const { render, renderHeader, scopedSlots, on, onNative, children, ...props } = propsData;
        const propData = {
          props,
          scopedSlots,
          on,
          onNative
        };
        const { prop, type, order } = prop;
        const key = order || type || prop;

        hasChildren && (propData.props['label-class-name'] = 'wst-table__column--children');

        propData.scopedSlots = propData.scopedSlots || {};

        if (render) {
          propData.scopedSlots.default = scope => <Render render={render} {...scope}></Render>;
        }
        // 增加全文检索模式，需要在doRequest的参数中传入searchType === 'fullText‘
        else if (
          props.type !== 'selection' &&
          this.extraParams &&
          this.extraParams.searchType === 'fullText'
        ) {
          propData.scopedSlots.default = scope => <Render render={highLightTransfer} {...scope}></Render>;
        }

        if (renderHeader) {
          propData.scopedSlots.header = scope => <Render render={renderHeader} {...scope}></Render>;
        }

        // 多级表头
        if (children && children.length) {
          return (
            <el-table-column {...propData} key={key}>
              {children.map(c => {
                return _renderColumn(c, true);
              })}
            </el-table-column>
          );
        }

        // 单级表头
        return <el-table-column {...propData} key={key}></el-table-column>;
      };
      return (
        <el-table
          ref='elTable'
          {...{
            props: {
              ...this.$attrs,
              data: this.curTableData,
              'row-key': this.rowKey,
              'span-method': this._spanMethod,
              'header-cell-style': this._headerCellStyle
            },
            on: {
              ...this.$listeners,
              'selection-change': this._handleSelectionChange
            },
            nativeOn: {
              selectionChange: this._handleSelectionChange
            },
            directives: [
              this.dragSortMode === 'thead'
                ? {
                    name: 'dragable',
                    value: {
                      dragable: this.dragSortable, // 是否可拖动
                      dragSelector: '.el-table__header-wrapper th .cell', //绑定拖动事件的元素
                      // 不能绑定拖动事件的元素，根据类名查找
                      excludeSelector: [
                        'wst-table__action-column',
                        'wst-table__type-column',
                        'wst-table__filter-column',
                        'wst-table__column--children'
                      ],
                      rebind: true, // 重新绑定事件
                      instance: this
                    }
                  }
                : {},
              this._server ? { name: 'loading', value: this.innerLoading } : {},
              !this.$attrs['max-height'] && this.autoHeight
                ? {
                    name: 'resize',
                    value: {
                      fixHeight: this.fixHeight,
                      minHeight: this.minHeight,
                      instance: this
                    }
                  }
                : {}
            ]
          }}>
          {this.tableColumns &&
            this.tableColumns.map(prop => {
              return _renderColumn(prop);
            })}
          <template slot='empty'>{this.$slots.empty}</template>
          <template slot='append'>{this.$slots.append}</template>
          {this._renderActionColumn()}
          {this._renderFilterColumn()}
        </el-table>
      );
    },
    _renderPagination() {
      return this.paginationShow && this.innerTotal ? (
        <el-row class={['wst-table__pager']}>
          <el-col span={24}>
            <el-pagination
              ref='elPagination'
              class={'wst-table__pagination'}
              background
              {...{
                attrs: this.innerPaginationProps,
                on: {
                  'size-change': this.handleSizeChange,
                  'prev-click': this.handlePrevClick,
                  'next-click': this.handleNextClick,
                  'current-change': this.handleCurrentChange
                }
              }}
              current-page={this.innerCurrentPage}
              page-size={this.innerPageSize}
              total={this.innerTotal}
              class={'wst-table__pagination'}>
              {
                <div
                  class={'wst-table__pagination-extra'}
                  {...{
                    style: {
                      float: this.innerPaginationProps.layout.indexOf('->') === -1 ? 'right' : 'left'
                    }
                  }}>
                  {/* 提供插槽供用户自定义分页栏内容 */}
                  {this.$scopedSlots['pagination'] &&
                    this.$scopedSlots['pagination']({
                      selection: this.innerSelection,
                      selectionData: this.innerSelectionData,
                      params: this.innerParams || {}
                    })}
                </div>
              }
            </el-pagination>
          </el-col>
        </el-row>
      ) : null;
    }
  },
  render() {
    const layoutMap = {
      tool: this._renderTool(),
      table: this._renderTable(),
      pagination: this._renderPagination(),
      extra: this.extraShow ? <div class={'wst-table__extra'}>{this.$slots['extra']}</div> : null
    };
    return (
      <div class={['wst-table', this.customTableClass]}>{this.layouts.map(layout => layoutMap[layout])}</div>
    );
  }
};
