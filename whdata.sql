SELECT sol.regionID, sol.constellationID, sol.solarSystemID, sol.solarSystemName, sol.x, sol.y, sol.z, sol.security, sol.radius, sol.sunTypeID, wh.wormholeClassID, md.typeID AS anomalyTypeID, inv.typeName AS anomalyName, reg.regionName, const.constellationName
FROM mapSolarSystems AS sol
LEFT JOIN mapLocationWormholeClasses AS wh ON wh.locationID = sol.regionID
LEFT JOIN mapDenormalize AS md ON md.solarSystemID = sol.solarSystemID AND md.groupID = 995
LEFT JOIN invTypes AS inv ON inv.typeID = md.typeID
LEFT JOIN mapRegions AS reg ON reg.regionID = sol.regionID
LEFT JOIN mapConstellations AS const ON const.constellationID = sol.constellationID
WHERE sol.regionID >= 11000001