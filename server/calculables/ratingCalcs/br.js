var ns = CF.CurrentData.calculatables;

ns.lib.calcs.calcBR =  function calcBR(system) {
  function getFlag() {
    if (!system.metrics || !system.metrics.supply) {
      return false;
    }

    if (!system.specs || !system.specs.supply) return true;
    if (system.specs.supply != system.metrics.supply) return true;
    return false;
  }

  var flag = getFlag()
  return {
    flag: flag,
    sum: 0//flag ? 1 : 0
  }
};
