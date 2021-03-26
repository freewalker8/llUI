export default {
  props: {
    // 是否可过滤列
    columnFilterable: {
      type: Boolean,
      default: false
    },
    // 选中的列，由column的prop属性组成
    columnFilterSelected: Array,
    // 过滤表单class
    columnFilterClass: {
      type: String,
      default: 'wst-table__filterColumn'
    },
    // 过滤表单宽度
    columnFilterWidth: {
      type: [String, Number],
      default: 400
    },
    // 每行显示的CheckBox数
    columnFilterRowNum: {
      type: Number,
      default: 4,
      validator(v) {
        return 24 % v === 0;
      }
    },
    // 筛选表单操作按钮，支持四种操作，按钮会按照你输入的顺序进行排列
    columnFilterButtonLayout: {
      type: String,
      default: 'cancel, all, reset' // 取消、全选、重置、确认
    },
    // 过滤表单取消按钮文本
    columnFilterCancelLabel: {
      type: String,
      default: '取消'
    },
    // 重置按钮文本
    columnFilterResetLabel: {
      type: String,
      default: '重置'
    },
    // 重置按钮文本
    columnFilterAllLabel: {
      type: String,
      default: '全选'
    },
    // 不包含操作列的最大展示列数，默认最大列数为全部列
    maxColumnNum: Number,
    // 最小展示列
    minColumnNum: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      checkedColumns: [], // 存储过滤表单的选中值
      filterColumnVisible: false
    };
  },
  computed: {
    // 计算最大展示列数
    innerMaxColumnNum() {
      return this.maxColumnNum || this.canFilterColumns.length;
    },
    // 计算字段所占宽度
    cellSpan() {
      return 24 / this.columnFilterRowNum;
    },
    // 计算哪些列字段被选中
    defaultCheckedColumns() {
      return this.columnFilterSelected || [...this.canFilterColumns.map(c => c.prop)];
    }
  },
  watch: {
    defaultCheckedColumns: {
      deep: true,
      immediate: true,
      handler(val) {
        this.checkedColumns = [...val];
      }
    },
    checkedColumns: {
      deep: true,
      handler(checked) {
        // 过滤表格列
        this.tableColumns = this.allColumns.filter(({ prop, type }) => {
          return checked.includes(prop) || !!type;
        });

        // 对外暴露筛选事件
        this.$emit('column-filter', checked);
      }
    }
  },
  methods: {
    _renderFilterForm() {
      return this.columnFilterable ? (
        <el-table-column
          prop='wst-table-filter-column'
          align='center'
          width='40'
          label-class-name='wst-table__filter-column'>
          <template slot='header'>
            <el-popover
              ref='filterColumnPopper'
              placement='left'
              width={this.columnFilterWidth}
              popperClass={this.columnFilterClass + 'wst-table__filter-column-warp'}
              {...{
                props: {
                  value: this.filterColumnVisible
                },
                on: {
                  input: val => {
                    this.filterColumnVisible = val;
                  }
                }
              }}>
              <el-checkbox-group
                ref='filterBox'
                {...{
                  model: {
                    value: this.checkedColumns,
                    callback: this._handleCheckboxChange
                  },
                  props: {
                    min: this.minColumnNum,
                    max: this.innerMaxColumnNum
                  },
                  directives: [
                    this.dragSortModel === 'formItem'
                      ? {
                          name: 'dragable',
                          value: {
                            dragable: this.dragSortable,
                            dragSelector: '.el-col',
                            instance: this
                          }
                        }
                      : {}
                  ]
                }}>
                <el-row>
                  {this.canFilterColumns.map(({ label, prop }, index) => {
                    return (
                      <el-col span={this.cellSpan} class='wst-table__filter-column-cellbox'>
                        <el-checkbox
                          {...{
                            props: {
                              label: prop,
                              key: prop
                            }
                          }}>
                          {index + 1}.{label}
                        </el-checkbox>
                      </el-col>
                    );
                  })}
                </el-row>
              </el-checkbox-group>
              {this._renderFilterButton()}
              <i slot='reference' class='el-icon-setting wst-table__filter-column-icon'></i>
            </el-popover>
          </template>
        </el-table-column>
      ) : null;
    },
    // 菜单按钮
    _renderFilterButton() {
      const btnMap = {
        all: (
          <el-button type='primary' size='mini' onClick={this._handlerFilterAll}>
            {this.columnFilterAllLabel}
          </el-button>
        ),
        reset: (
          <el-button type='primary' size='mini' onClick={this._handlerFilterReset}>
            {this.columnFilterResetLabel}
          </el-button>
        ),
        cancel: (
          <el-button type='default' size='mini' onClick={this._handlerFilterCancel}>
            {this.columnFilterCancelLabel}
          </el-button>
        )
      };

      let buttons = this.columnFilterButtonLayout.split(',').map(b => b.trim());

      return (
        <el-row>
          <el-col span={24}>
            <div class='wst-table__filter-column-button'>{buttons.map(b => btnMap[b])}</div>
          </el-col>
        </el-row>
      );
    },
    // 处理表单选中项的变化
    _handleCheckboxChange(val) {
      this.columnCounter += val.length - this.checkedColumns.length;
      this.checkedColumns = [...val];
    },
    // 关闭表单
    _handlerFilterCancel() {
      this.$refs.filterColumnPopper.showPopper = false;
    },
    // 重置为初始状态
    _handlerFilterReset() {
      this._handleCheckboxChange(this.columnFilterSelected || this.canFilterColumns.map(c => c.prop));
    },
    // 选中全部列，但选中的列数不能超过设置的最大显示列（maxColumnNum）
    _handlerFilterAll() {
      this._handleCheckboxChange(this.canFilterColumns.slice(0, this.innerMaxColumnNum).map(c => c.prop));
    }
  }
};
