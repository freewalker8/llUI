import Table from '../mixins/table';

export default {
  name: 'LlTable',
  mixins: [Table],
  computed: {
    curTableData() {
      if (this.paginationShow && this.innerTotal) {
        let ceilTotalPage = Math.ceil(this.innerTotal / this.innerPageSize);
        if (this.innerCurrentPage > ceilTotalPage) {
          console.warn(
            `[ll-table]: currentPage ${this.currentPage} beyond total page ${ceilTotalPage} (data.length/pageSize,${this.innerTotal}/${this.innerPageSize}), set currentPage to totalPage: ${ceilTotalPage}`
          );
          this.innerCurrentPage = ceilTotalPage;
        }
        let from = this.innerPageSize * (this.innerCurrentPage - 1);
        let to = from + this.innerPageSize;
        return this.data.slice(from, to);
      }
      return this.data;
    },
    innerTotal() {
      return this.data.length;
    }
  },
  methods: {
    /**
     * 重置表格
     * @public
     */
    resetTable() {
      this._resetTable();
    }
  }
};
