import { debounce, get } from 'lodash-es';
import Axios from 'axios';
import { isArray, isFunction } from 'utils/util';
import Table from '../mixins/table';

export default {
  name: 'LlTableSync',
  mixins: [Table],
  props: {
    total: {
      type: Number
    },
    loading: {
      type: Boolean,
      default: false
    },
    autoInit: {
      type: Boolean,
      default: true
    },
    // 数据查询函数或axios配置项，用于获取表格数据；当为函数时请返回组件能直接使用的数据，格式为{data,total,pageSize,currentPage}
    httpRequest: {
      type: [Function, Object]
    },
    // 查询参数
    params: {
      type: Object,
      default: () => {}
    },
    // 数据映射，映射接口返回的数据，使组件能正确的获取数据
    propsMap: {
      type: Object,
      default: () => ({
        data: 'data',
        total: 'total',
        pageSize: 'pageSize',
        currentPage: 'currentPage'
      }),
      validator(val) {
        if (!val.data || !val.total) {
          console.error(
            `[ll-table]:The binding value of 'props-map' attribute must contain properties 'data' and 'total'`
          );
          return false;
        }
        return true;
      }
    }
  },
  data() {
    return {
      innerLoading: false,
      curTableData: [],
      extraParams: {},
      innerTotal: 0,
      innerParams: {}
    };
  },
  watch: {
    loading(val) {
      this.innerLoading = val;
    },
    data: {
      deep: true,
      immediate: true,
      handler(val) {
        this.curTableData = val;
      }
    },
    params: {
      deep: true,
      immediate: true,
      handler(val) {
        this.innerParams = val;
      }
    },
    innerParams(val) {
      this.$emit('update:params', val);
    },
    total: {
      immediate: true,
      handler(total) {
        let totalPage = total ? Math.ceil(total / this.innerPageSize) : 0;
        if (totalPage === 0) {
          this.innerTotal = 0;
        } else {
          this.innerTotal = total;
          totalPage < this.innerCurrentPage && (this.innerCurrentPage = totalPage);
        }
      }
    }
  },
  created() {
    this._server = true;
    // 当pageSize变化，并且引起currentPage变化时，可以避免重复发起请求
    this.handleHttpRequest = debounce(this._handleHttpRequest, 10);

    if (this.autoInit && this.httpRequest) {
      this._handleHttpRequest();
    }
  },
  methods: {
    /**
     * @public
     */
    doRequest(extraParams, ...reset) {
      this.extraParams = extraParams;
      this._handleHttpRequest(extraParams, ...reset);
    },
    /**
     * @public
     * 保留查询参数刷新表格
     */
    reload() {
      this.$nextTick(this._handleHttpRequest);
    },
    /**
     * @public
     * 重置表格
     * 如果有自定义的工具栏则需要自己先清除工具栏里面的搜索条件
     */
    resetTable() {
      this._resetTable();
      this.reload();
    },
    _handleHttpRequest({ pageSize, currentPage, ...other } = {}, ...rest) {
      this.innerLoading = true;

      const payload = {
        ...other,
        pageSize: pageSize || this.innerPageSize,
        currentPage: currentPage || this.innerCurrentPage
      };
      return Promise.resolve(this._httpRequest(payload, ...rest))
        .then(val => {
          // 当请求返回时，当前页已经改变（一般出现在快速切换分页时），不做处理，只更新最后一次分页获取的数据
          const isCurrent =
            payload.pageSize === this.innerPageSize && payload.currentPage === this.innerCurrentPage;

          if (!isCurrent) return;

          if (isArray(val)) {
            this.curTableData = val;
          } else {
            this.curTableData = get(val, this.propsMap.data, []);
            this.innerTotal = parseInt(get(val, this.propsMap.total, this.innerTotal));

            // 最后一页数据为空时调到上一页
            if (this.curTableData.length === 0 && this.innerCurrentPage > 1) {
              this._handleCurrentChange(--this.innerCurrentPage);
            }
          }
          this.$emit('data-change', {
            [this.propsMap.data]: this.curTableData,
            [this.propsMap.total]: this.innerTotal,
            [this.propsMap.pageSize || 'pageSize']: this.innerPageSize,
            [this.propsMap.currentPage || 'currentPage']: this.innerCurrentPage,
            params: this.innerParams
          });
        })
        .catch(() => {
          console.error(`[ll-table]:get romote data failed, detail:${e}`)
          this.innerLoading = false;
        })
        .finally(() => {
          this.innerLoading = false;
        });
    },
    _httpRequest({ pageSize, currentPage, ...other } = {}, ...rest) {
      const queryInfo = {
        ...other,
        ...this.params,
        ...this.extraParams
      };

      this.propsMap.pageSize && (queryInfo[this.propsMap.pageSize.split('.').slice(-1)] = pageSize);
      this.propsMap.currentPage && (queryInfo[this.propsMap.currentPage.split('.').slice(-1)] = currentPage);
      this.innerParams = queryInfo;

      if (isFunction(this.httpRequest)) return this.httpRequest(queryInfo, ...rest);

      const options = { method: 'get', ...this.httpRequest };

      if (options.method === 'get') {
        options.params = Object.assign({}, options.params || {}, queryInfo);
      } else {
        options.data = Object.assign({}, options.data || {}, queryInfo);
      }

      return Axios(options).then(res => {
        if (res.status === 200) return res.data;
      });
    },
    /**
     * @override
     */
    _handleSizeChange(size) {
      if (this.httpRequest) {
        this._handleHttpRequest({ pageSize: size }, 'size');
      }
      this.innerPageSize = size;
    },
    /**
     * @override
     */
    _handleCurrentChange(page) {
      if (this.httpRequest) {
        this._handleHttpRequest({ currentPage: page }, 'page');
      }
      this.innerCurrentPage = page;
    }
  }
};
