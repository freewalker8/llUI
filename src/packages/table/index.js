import VeTable from './components/VeTable';
import VeTableSync from './components/VeTableSync';

VeTable.install = function(Vue) {
  Vue.component(VeTable.name, VeTable);
};

VeTableSync.install = function(Vue) {
  Vue.component(VeTableSync.name, VeTableSync);
};

const install = function(Vue) {
  VeTable.install(Vue);
  VeTableSync.install(Vue);
};

export { install, VeTable, VeTableSync };

export default {
  install
};
