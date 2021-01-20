import { merge } from 'lodash-es';
import { isFunction, uuid } from 'utils/util';

export default {
  props: {
    actionColumn: {
      type: Object,
      default() {
        return {
          props: {
            label: '操作',
            width: '100px'
          },
          buttons: [],
          render: null
        };
      }
    },
    computed: {
      showActionColumn() {
        const { buttons, render } = this.innerActionColumn;
        return buttons.length > 0 || isFunction(render);
      },
      innerActionColumn() {
        let { label, ...actionColumn } = this.actionColumn;
        const { $slots } = this;
        const templateActions = ($slots.actions || []).map(button => {
          const propsData = (button.componentOptions && button.componentOptions.propsData) || {};
          return { ...propsData, ...(button.data || {}).attrs };
        });

        return merge(
          {
            show: true,
            buttons: [...templateActions],
            props: { label: label || '操作' }
          },
          actionColumn
        );
      }
    }
  },
  data() {
    return {
      actionColumnProp: uuid()
    };
  },
  methods: {
    _renderActionColumn() {
      return this.showActionColumn ? (
        <el-table-column
          prop={this.actionColumnProp}
          {...{
            attrs: this.innerActionColumn.props,
            props: {
              'label-class-name': 'wst-table__action-column'
            },
            scopedSlots: {
              default: scope => {
                return (
                  <div class='wst-table__action-list'>
                    {/* 支持传递buttons配置 */}
                    {this.innerActionColumn.buttons.map(button => {
                      const { type: buttonType, icon, props, handler, label } = button;
                      let buttonProps = Object.assign(
                        {
                          type: buttonType || 'text',
                          icon
                        },
                        props
                      );

                      let clickHandler = function() {
                        handler && handler(scope);
                      };

                      return (
                        <el-button onClick={clickHandler} {...{ attrs: buttonProps }}>
                          {label}
                        </el-button>
                      );
                    })}
                    {/* 支持render渲染 */}
                    {isFunction(this.innerActionColumn.render) && (
                      <Render render={this.innerActionColumn.render}></Render>
                    )}
                  </div>
                );
              }
            }
          }}></el-table-column>
      ) : null;
    }
  }
};
