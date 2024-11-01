import { defineStore } from "pinia";
import { markRaw } from "vue";

export const useChartStore = defineStore("chart", {
  state: () => ({
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    ctm: [1, 0, 0, 1, 0, 0],
    inverseCtm: [1, 0, 0, 1, 0, 0],
    tableGroups: {},
    tables: {},
    refs: {},
    grid: {
      size: 100,
      divisions: 10,
      snap: 5
    },
    loaded: false,
    tooltip: {
      x: 0,
      y: 0,
      show: false,
      target: null,
      component: null,
      binds: null,
      width: 0,
      height: 0
    }
  }),
  getters: {
    subGridSize(state) {
      return state.grid.size / state.grid.divisions;
    },
    persistenceData(state) {
      const { zoom, pan, ctm, inverseCtm, tables, refs } = state;
      return  { zoom, pan, ctm, inverseCtm, tables, refs };
    },
    getPan(state) {
      return state.pan;
    },
    getZoom(state) {
      return state.zoom;
    },
    getCTM(state) {
      return state.ctm;
    },
    getTable(state) {
      return (tableId) => {
        if (!(tableId in state.tables))
          state.tables[tableId] = {
            x: 0,
            y: 0,
            width: 200,
            height: 32
          };
        return state.tables[tableId];
      };
    },
    getTableGroup(state) {
      return (tableGroupId) => {
        if (!(tableGroupId in state.tableGroups))
          state.tableGroups[tableGroupId] = {
            x: 0,
            y: 0,
            width: 200,
            height: 32
          };
        return state.tableGroups[tableGroupId];
      };
    },
    getRef(state) {
      return (refId) => {
        if (!(refId in state.refs))
          state.refs[refId] = {
            endpoints: [],
            vertices: [],
            auto: true
          };
        return state.refs[refId];
      };
    },
    save(state) {
      return {
        zoom: state.zoom,
        pan: state.pan,
        ctm: state.ctm,
        inverseCtm: state.inverseCtm,
        tables: state.tables,
        refs: state.refs,
        grid: state.grid
      };
    }
  },
  actions: {
    showTooltip(target, component, binds) {
      this.tooltip = {
        x: target.x,
        y: target.y,
        component: markRaw(component),
        binds,
        show: true
      };
    },
    hideTooltip() {
      this.tooltip = {
        x:0,
        y:0,
        width:0,
        height:0,
        component: null,
        binds: null,
        show: false
      };
    },
    loadDatabase(database) {
      for(const tableGroup of database.schemas[0].tableGroups)
      {
        this.getTableGroup(tableGroup.id);
      }
      for(const table of database.schemas[0].tables)
      {
        this.getTable(table.id);
      }
      for(const ref of database.schemas[0].refs)
      {
        this.getRef(ref.id);
      }

      this.loaded = true;
    },
    load(state) {
      this.$reset();
      this.$patch({
        ...state,
        ctm: DOMMatrix.fromMatrix(state.ctm),
        inverseCtm: DOMMatrix.fromMatrix(state.inverseCtm).inverse()
      });
    },
    updatePan(newPan) {
      this.$patch({
        pan: {
          x: newPan.x,
          y: newPan.y
        }
      });
    },

    updateZoom(newZoom) {
      this.$patch({
        zoom: newZoom
      });
    },

    updateCTM(newCTM) {
      this.$patch({
        ctm: DOMMatrix.fromMatrix(newCTM),
        inverseCtm: DOMMatrix.fromMatrix(newCTM).inverse()
      });
    },

    updateTable(tableId, newTable) {
      this.tables.$patch({
        [tableId]: newTable
      });
    },
    updateRef(refId, newRef) {
      this.refs.$patch({
        [refId]: newRef
      });
    },

    zoomToFit() {
      // Get the bounding box of all tables and refs
      const bbox = this.calculateBoundingBox();
  
      // Get viewport dimensions (you can replace these with your actual dimensions)
      const viewportWidth = 800; // example width
      const viewportHeight = 600; // example height
  
      // Calculate scale factors
      const scaleX = viewportWidth / bbox.width;
      const scaleY = viewportHeight / bbox.height;
      const scale = Math.min(scaleX, scaleY);
  
      // Update the zoom state
      this.updateZoom(scale);
  
      // Optional: Center the view (if you have pan implemented)
      this.updatePan({
        x: (viewportWidth - bbox.x * scale) / 2,
        y: (viewportHeight - bbox.y * scale) / 2
      });
    },
  
    calculateBoundingBox() {
      const tables = Object.values(this.tables);
      const refs = Object.values(this.refs);
  
      const allElements = [...tables, ...refs];
  
      if (allElements.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
  
      const xCoords = allElements
      .map(el => el.x)
      .filter(x => x !== undefined); // Filter out undefined values
  
    const yCoords = allElements
      .map(el => el.y)
      .filter(y => y !== undefined); // Filter out undefined values
  
    const widths = allElements
      .map(el => el.width)
      .filter(width => width !== undefined); // Filter out undefined values
  
    const heights = allElements
      .map(el => el.height)
      .filter(height => height !== undefined); // Filter out undefined values

      console.log(xCoords, yCoords, widths, heights);
  
      const minX = Math.min(...xCoords);
      const minY = Math.min(...yCoords);
      const maxX = Math.max(...xCoords.map((x, index) => x + widths[index]));
      const maxY = Math.max(...yCoords.map((y, index) => y + heights[index]));
      
      console.log(minX, minY, maxX-minX, maxY-minY);

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
  }
});
