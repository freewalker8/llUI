import LlTable from './components/Table';
import LlTableSync from './components/TableSync';

LlTable.install = function(Vue) {
  Vue.component(LlTable.name, LlTable);
};

LlTableSync.install = function(Vue) {
  Vue.component(LlTableSync.name, LlTableSync);
};

const install = function(Vue) {
  LlTable.install(Vue);
  LlTableSync.install(Vue);
};

export { install, LlTable, LlTableSync };

export default {
  install
};
