"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Map = void 0;
const unit_1 = require("./tile/unit");
const city_1 = require("./tile/city");
const tile_1 = require("./tile");
const improvement_1 = require("./tile/improvement");
const utils_1 = require("../../utils");
const trade_1 = require("./trade");
const yield_1 = require("./tile/yield");
const errand_1 = require("./tile/errand");
const knowledge_1 = require("./tile/knowledge");
// MAGIC NUMBER CONSTANTS - TODO GET RID OF THESE!
const TRADER_SPEED = 1;
const TRADER_CAPACITY = {
    food: 10,
    production: 10,
};
class Map {
    constructor(height, width) {
        this.height = height;
        this.width = width;
        this.tiles = new Array(height * width);
        this.cities = [];
        this.traders = [];
        this.updates = [];
    }
    export() {
        return {
            height: this.height,
            width: this.width,
            tiles: this.tiles.map(tile => tile.export()),
            cities: this.cities.map(city => city.export()),
            traders: this.traders.map(trader => trader.export()),
        };
    }
    static import(data) {
        const map = new Map(data.height, data.width);
        map.tiles = data.tiles.map(tileData => tile_1.Tile.import(tileData));
        map.cities = data.cities.map(cityData => {
            const city = city_1.City.import(cityData);
            const set = city.getTiles();
            for (const coords of set) {
                map.setTileOwner(coords, city, false);
            }
            return city;
        });
        map.traders = data.traders.map(traderData => trade_1.Trader.import(map, traderData));
        return map;
    }
    pos({ x, y }) {
        return (y * this.width) + (0, utils_1.mod)(x, this.width);
    }
    coords(pos) {
        return {
            x: (0, utils_1.mod)(pos, this.width),
            y: Math.floor(pos / this.width),
        };
    }
    getUpdates() {
        return this.updates.splice(0);
    }
    getTile(coords) {
        return this.tiles[this.pos(coords)];
    }
    setTile(coords, tile) {
        this.tiles[this.pos(coords)] = tile;
    }
    forEachTile(callback) {
        for (let pos = 0; pos < this.tiles.length; pos++) {
            const tile = this.tiles[pos];
            const coords = this.coords(pos);
            callback(tile, coords);
        }
    }
    getNeighborsRecurse(coords, r, tileSet, coordList, rangeMap, filter) {
        const tile = this.getTile(coords);
        if (r >= 0 && tile) {
            if (!tileSet.has(tile)) {
                if (!filter || filter(tile, coords)) {
                    tileSet.add(tile);
                    coordList.push(coords);
                    rangeMap[this.pos(coords)] = r;
                }
            }
            for (const coord of (0, utils_1.getAdjacentCoords)(coords)) {
                const pos = this.pos(coord);
                if (!rangeMap[pos] || rangeMap[pos] < r - 1) {
                    this.getNeighborsRecurse(coord, r - 1, tileSet, coordList, rangeMap, filter);
                }
            }
        }
    }
    getNeighborsCoords(coords, r = 1, options) {
        const coordList = [];
        this.getNeighborsRecurse(coords, r, new Set(), coordList, {}, options === null || options === void 0 ? void 0 : options.filter);
        return coordList;
    }
    getPathTree(srcPos, range, mode) {
        // BFS to find all tiles within `range` steps
        const queue = [];
        queue.push(srcPos);
        const dst = {};
        dst[this.pos(srcPos)] = 0;
        const paths = {};
        while (queue.length) {
            const atPos = queue.shift();
            for (const adjPos of this.getNeighborsCoords(atPos)) {
                const tile = this.getTile(adjPos);
                // PATH BLOCKING LOGIC HERE
                // if (tile.unit && tile.unit.civID === this.player.civID) continue;
                const movementCost = mode !== unit_1.MovementClass.AIR ? tile.movementCost[mode] || Infinity : 1;
                if (!(this.pos(adjPos) in dst) || dst[this.pos(adjPos)] > dst[this.pos(atPos)] + movementCost) {
                    dst[this.pos(adjPos)] = dst[this.pos(atPos)] + movementCost;
                    if (dst[this.pos(adjPos)] <= range) {
                        paths[this.pos(adjPos)] = atPos;
                        queue.push(adjPos);
                    }
                }
            }
        }
        return [paths, dst];
    }
    getVisibleTilesRecurse(coords, maxElevation, slope, r, direction, coordsArray, tileSet, stepsUntilSpread, stepLength) {
        const tile = this.getTile(coords);
        if (r > 0) {
            if (!tileSet.has(tile) && tile.getTotalElevation() >= maxElevation) {
                coordsArray.push(coords);
                tileSet.add(tile);
            }
            if (stepsUntilSpread === 0) {
                const newLeftCoords = (0, utils_1.getCoordInDirection)(coords, direction - 1);
                const newLeftTile = this.getTile(newLeftCoords);
                const newLeftSlope = newLeftTile.getTotalElevation() - maxElevation;
                this.getVisibleTilesRecurse(newLeftCoords, maxElevation + slope, Math.max(slope, newLeftSlope), r - 1, direction, coordsArray, tileSet, stepLength, stepLength);
                const newCoords = (0, utils_1.getCoordInDirection)(coords, direction);
                const newTile = this.getTile(newCoords);
                const newSlope = newTile.getTotalElevation() - maxElevation;
                this.getVisibleTilesRecurse(newCoords, maxElevation + slope, Math.max(slope, newSlope), r - 1, direction, coordsArray, tileSet, stepLength, stepLength);
                const newRightCoords = (0, utils_1.getCoordInDirection)(coords, direction + 1);
                const newRightTile = this.getTile(newRightCoords);
                const newRightSlope = newRightTile.getTotalElevation() - maxElevation;
                this.getVisibleTilesRecurse(newRightCoords, maxElevation + slope, Math.max(slope, newRightSlope), r - 1, direction, coordsArray, tileSet, stepLength, stepLength);
            }
            else {
                const newCoords = (0, utils_1.getCoordInDirection)(coords, direction);
                const newTile = this.getTile(newCoords);
                const newSlope = newTile.getTotalElevation() - maxElevation;
                this.getVisibleTilesRecurse(newCoords, maxElevation + slope, Math.max(slope, newSlope), r - 1, direction, coordsArray, tileSet, stepsUntilSpread - 1, stepLength);
            }
        }
    }
    getVisibleTilesCoords(unit, range) {
        const coordsArray = [];
        const tileSet = new Set();
        const tile = this.getTile(unit.coords);
        coordsArray.push(unit.coords);
        tileSet.add(tile);
        for (let direction = 0; direction < 6; direction++) {
            const newCoords = (0, utils_1.getCoordInDirection)(unit.coords, direction);
            const newTile = this.getTile(newCoords);
            const slope = newTile.getTotalElevation() - tile.getTotalElevation();
            this.getVisibleTilesRecurse(newCoords, this.getTile(unit.coords).getTotalElevation() + slope, slope, range !== null && range !== void 0 ? range : unit.visionRange, direction, coordsArray, tileSet, 0, 1);
        }
        return coordsArray;
    }
    canUnitSee(unit, targetCoords, options) {
        var _a, _b;
        const isAttack = (_a = options === null || options === void 0 ? void 0 : options.isAttack) !== null && _a !== void 0 ? _a : false;
        const visibleTiles = this.getVisibleTilesCoords(unit, isAttack ? ((_b = unit.attackRange) !== null && _b !== void 0 ? _b : 1) : unit.visionRange);
        return (0, utils_1.arrayIncludesCoords)(visibleTiles, targetCoords);
    }
    canUnitAttack(unit, target) {
        if (unit.promotionClass === unit_1.PromotionClass.RANGED) {
            return this.canUnitSee(unit, target.coords, { isAttack: true });
        }
        else {
            return unit.isAdjacentTo(target.coords);
        }
    }
    setTileOwner(coords, owner, overwrite) {
        var _a;
        const tile = this.getTile(coords);
        if (tile.owner) {
            if (!overwrite)
                return;
            (_a = tile.owner) === null || _a === void 0 ? void 0 : _a.removeTile(coords);
            tile.setVisibility(tile.owner.civID, false);
        }
        tile.owner = owner;
        tile.setVisibility(owner.civID, true);
        owner.addTile(coords);
    }
    getCivTile(civID, tile) {
        if (tile.discoveredBy[civID]) {
            if (tile.visibleTo[civID]) {
                return tile.getVisibleData();
            }
            else {
                return tile.getDiscoveredData();
            }
        }
        else {
            return null;
        }
    }
    getCivMap(civID) {
        return this.tiles.map((tile) => {
            return this.getCivTile(civID, tile);
        });
    }
    getCivTraders(civID) {
        return this.traders.filter((trader) => trader.civID === civID).map(trader => trader.getData());
    }
    setTileVisibility(civID, coords, visible) {
        this.getTile(coords).setVisibility(civID, visible);
        this.tileUpdate(coords);
    }
    isInBounds({ x, y }) {
        return (0, utils_1.mod)(x, this.width) >= 0 && (0, utils_1.mod)(x, this.width) < this.width && y >= 0 && y < this.height;
    }
    tileUpdate(coords) {
        // if (coords.x === null && coords.y === null) return;
        const tile = this.getTile(coords);
        this.updates.push((civID) => ['tileUpdate', [coords, this.getCivTile(civID, tile)]]);
    }
    moveUnitTo(unit, coords) {
        // mark tiles currently visible by unit as unseen
        const srcVisible = this.getVisibleTilesCoords(unit);
        for (const visibleCoords of srcVisible) {
            this.setTileVisibility(unit.civID, visibleCoords, false);
        }
        this.getTile(unit.coords).setUnit(undefined);
        this.tileUpdate(unit.coords);
        unit.coords = coords;
        this.getTile(coords).setUnit(unit);
        this.tileUpdate(coords);
        // mark tiles now visible by unit as seen
        const newVisible = this.getVisibleTilesCoords(unit);
        for (const visibleCoords of newVisible) {
            this.setTileVisibility(unit.civID, visibleCoords, true);
        }
    }
    addTrader(trader) {
        this.traders.push(trader);
    }
    findPath(pathTree, srcPosKey, target) {
        if (srcPosKey in pathTree) {
            if (this.pos(pathTree[srcPosKey]) === this.pos(target)) {
                return [target];
            }
            else {
                const subPath = this.findPath(pathTree, this.pos(pathTree[srcPosKey]), target);
                if (!subPath)
                    return null;
                return [pathTree[srcPosKey], ...subPath];
            }
        }
        else {
            return null;
        }
    }
    findRoute(pathTree, dst, srcPosKey, target) {
        const srcCoords = this.coords(srcPosKey);
        const path = this.findPath(pathTree, srcPosKey, target);
        if (!path)
            return null;
        const fullPath = [srcCoords].concat(path);
        /***
         * Routes *must* guarantee that *both* the source and target tiles are included within the path,
         * unlike normal paths which only include the target. To guarantee this, the Route cannot be
         * returned if the expected source and target tiles are not the same as those on the path.
         */
        const [srcTile, targetTile] = [this.getTile(srcCoords), this.getTile(target)];
        if (!(srcTile === this.getTile(fullPath[0]) && targetTile === this.getTile(path[path.length - 1])))
            return null;
        return [fullPath, dst[srcPosKey]];
    }
    createTradeRoutes(civID, coords, sink, requirement, range = 5, mode = 0) {
        var _a;
        const [pathTree, dst] = this.getPathTree(coords, range, mode);
        const posKeys = Object.keys(dst).sort((a, b) => {
            if (dst[a] > dst[b])
                return 1;
            else
                return -1;
        });
        for (const pos of posKeys) {
            const tile = this.tiles[pos];
            if (((_a = tile.owner) === null || _a === void 0 ? void 0 : _a.civID) === civID && tile.canSupply(requirement)) {
                const route = this.findRoute(pathTree, dst, Number(pos), coords);
                if (!route)
                    continue;
                this.addTrader(new trade_1.Trader(civID, route, tile.improvement, sink, TRADER_SPEED, yield_1.Yield.min(TRADER_CAPACITY, requirement)));
            }
        }
    }
    canSettleOn(tile) {
        return (!tile.owner &&
            tile.type !== 'ocean' &&
            tile.type !== 'frozen_ocean' &&
            tile.type !== 'mountain' &&
            tile.type !== 'coastal' &&
            tile.type !== 'frozen_coastal' &&
            tile.type !== 'river');
    }
    settleCityAt(coords, name, civID) {
        const tile = this.getTile(coords);
        if (!this.canSettleOn(tile))
            return false;
        const city = new city_1.City(coords, name, civID);
        this.cities.push(city);
        for (const neighbor of this.getNeighborsCoords(coords)) {
            this.setTileOwner(neighbor, city, false);
            this.tileUpdate(neighbor);
        }
        this.buildImprovementAt(coords, 'settlement', civID);
        return true;
    }
    startErrandAt(coords, improvement, errand) {
        improvement.startErrand(errand);
        this.tileUpdate(coords);
    }
    startConstructionAt(coords, improvementType, ownerID) {
        var _a;
        const tile = this.getTile(coords);
        if (((_a = tile.owner) === null || _a === void 0 ? void 0 : _a.civID) !== ownerID)
            return;
        tile.improvement = new improvement_1.Improvement('worksite', tile.baseYield);
        this.startErrandAt(coords, tile.improvement, {
            type: errand_1.ErrandType.CONSTRUCTION,
            option: improvementType,
        });
        this.createTradeRoutes(ownerID, coords, tile.improvement, tile.improvement.errand.cost);
        this.tileUpdate(coords);
    }
    canBuildOn(tile) {
        return (tile.type !== 'ocean' &&
            tile.type !== 'frozen_ocean' &&
            tile.type !== 'mountain');
    }
    buildImprovementAt(coords, type, ownerID) {
        var _a;
        const tile = this.getTile(coords);
        if (((_a = tile.owner) === null || _a === void 0 ? void 0 : _a.civID) !== ownerID)
            return;
        if (!this.canBuildOn(tile))
            return;
        tile.improvement = new improvement_1.Improvement(type, tile.baseYield);
        this.tileUpdate(coords);
    }
    trainUnitAt(coords, unitType, ownerID) {
        var _a;
        const tile = this.getTile(coords);
        if (((_a = tile.owner) === null || _a === void 0 ? void 0 : _a.civID) === ownerID && tile.improvement) {
            if (tile.getTrainableUnitTypes().includes(unitType)) {
                if (!tile.improvement.errand) {
                    // TODO - maybe change this in the future, to where new training errands overwrite old ones?
                    // That would require gracefully closing the previous errands though, so that is for later.
                    this.startErrandAt(coords, tile.improvement, {
                        type: errand_1.ErrandType.UNIT_TRAINING,
                        option: unitType,
                        location: coords,
                    });
                    this.createTradeRoutes(ownerID, coords, tile.improvement, tile.improvement.errand.cost);
                }
            }
        }
        this.tileUpdate(coords);
    }
    researchKnowledgeAt(coords, knowledgeName, ownerID) {
        var _a;
        const tile = this.getTile(coords);
        if (((_a = tile.owner) === null || _a === void 0 ? void 0 : _a.civID) === ownerID && tile.improvement) {
            // Note that this check technically allows the client to "cheat": research errands can begin without
            // the prerequesites having been fulfilled. These errands will simply do nothing when completed.
            if (tile.improvement.getResearchableKnowledgeNames().includes(knowledgeName)) {
                // TODO - change this in the future, to where new research errands overwrite old ones?
                // That would require gracefully closing the previous errands though, so that is for later.
                if (!tile.improvement.errand) {
                    this.startErrandAt(coords, tile.improvement, {
                        type: errand_1.ErrandType.RESEARCH,
                        option: knowledgeName,
                        location: coords,
                    });
                    this.createTradeRoutes(ownerID, coords, tile.improvement, tile.improvement.errand.cost);
                }
            }
        }
        this.tileUpdate(coords);
    }
    turn(world) {
        // Tiles
        this.forEachTile((tile, coords) => {
            var _a;
            if (tile.improvement) {
                tile.improvement.work();
                if ((_a = tile.improvement.errand) === null || _a === void 0 ? void 0 : _a.completed) {
                    tile.improvement.errand.complete(world, this, tile);
                    delete tile.improvement.errand;
                }
            }
            const knowledges = tile.getKnowledges(false);
            if (knowledges.length > 0) {
                const spillover = tile.getKnowledgeSpillover();
                for (const name in spillover) {
                    const [spilloverPoints, maxPoints] = spillover[name];
                    for (const neighborCoords of this.getNeighborsCoords(coords)) {
                        this.getTile(neighborCoords).addKnowledge(knowledge_1.Knowledge.knowledgeTree[name], spilloverPoints, 0.1, maxPoints);
                    }
                }
            }
        });
        // Traders
        for (let i = 0; i < this.traders.length; i++) {
            const trader = this.traders[i];
            trader.shunt();
            if (trader.expired) {
                this.traders.splice(i, 1);
                i--;
            }
        }
    }
}
exports.Map = Map;
//# sourceMappingURL=index.js.map