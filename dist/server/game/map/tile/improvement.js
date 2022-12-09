"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Improvement = void 0;
const errand_1 = require("./errand");
const unit_1 = require("./unit");
const yield_1 = require("./yield");
class Improvement {
    constructor(type, baseYield, metadata) {
        var _a, _b;
        if (!(type && baseYield))
            return;
        this.type = type;
        this.pillaged = false;
        this.isNatural = Improvement.naturalImprovementTable[type];
        this.yield = baseYield.add((_a = Improvement.yieldTable[type]) !== null && _a !== void 0 ? _a : new yield_1.Yield({}));
        this.metadata = metadata;
        this.storage = new yield_1.ResourceStore((_b = Improvement.storeCapTable[type]) !== null && _b !== void 0 ? _b : {});
        this.traders = [];
        this.suppliers = [];
        if (this.isNatural) {
            this.yield = new yield_1.Yield({});
        } // else if (type === 'worksite') {
        //   this.yield = new Yield({});
        // }
    }
    export() {
        var _a;
        return {
            type: this.type,
            pillaged: this.pillaged,
            isNatural: this.isNatural,
            yield: this.yield,
            storage: this.storage,
            errand: (_a = this.errand) === null || _a === void 0 ? void 0 : _a.export(),
        };
    }
    static import(data) {
        const improvement = new Improvement();
        improvement.type = data.type;
        improvement.pillaged = data.pillaged;
        improvement.isNatural = data.isNatural;
        improvement.yield = new yield_1.Yield(data.yield);
        const storageCap = data.storage.capacity;
        delete data.storage.capacity;
        improvement.storage = new yield_1.ResourceStore(storageCap).incr(new yield_1.Yield(data.storage));
        if (data.errand)
            improvement.errand = errand_1.WorkErrand.import(improvement.storage, data.errand);
        improvement.traders = [];
        improvement.suppliers = [];
        return improvement;
    }
    getData() {
        var _a;
        return {
            type: this.type,
            pillaged: this.pillaged,
            storage: this.storage,
            errand: (_a = this.errand) === null || _a === void 0 ? void 0 : _a.getData(),
        };
    }
    /**
     *
     * @returns list of units classes this improvement knows how to train
     */
    getTrainableUnitClasses() {
        var _a;
        return (_a = Improvement.trainableUnitClassTable[this.type]) !== null && _a !== void 0 ? _a : [];
    }
    /**
     *
     * @returns list of knowledges this improvement knows how to research
     */
    getResearchableKnowledges() {
        var _a;
        return (_a = Improvement.researchableKnowledgeTable[this.type]) !== null && _a !== void 0 ? _a : [];
    }
    startErrand(errand) {
        this.errand = new errand_1.WorkErrand(this.storage, errand);
    }
    work() {
        // TODO - ADD POPULATION/COST CHECK
        // if (type === 'farm') {
        // }
        if (this.errand) {
            if (this.storage.fulfills(this.errand.cost)) {
                this.errand.completed = true;
                for (const supplier of this.suppliers) {
                    supplier.expire();
                }
                this.storage.decr(this.errand.cost);
                this.storage.setCapacity(Improvement.storeCapTable[this.type]);
            }
            this.errand.storedThisTurn.reset();
        }
        let traderCount = this.traders.length;
        for (let i = 0; i < this.traders.length; i++) {
            const trader = this.traders[i];
            if (trader.expired) {
                this.traders.splice(i, 1);
                i--;
                traderCount--;
                continue;
            }
            const traderShare = this.storage.divNumber(traderCount);
            const surplus = trader.store(traderShare);
            this.storage.decr(traderShare.decr(surplus));
            traderCount--;
        }
        this.storage.incr(this.yield);
        this.storage.cap();
    }
    store(resources) {
        var _a;
        this.storage.incr(resources);
        (_a = this.errand) === null || _a === void 0 ? void 0 : _a.storedThisTurn.incr(resources);
    }
    subscribeTrader(trader) {
        this.traders.push(trader);
    }
    subscribeSupplier(trader) {
        this.suppliers.push(trader);
    }
}
exports.Improvement = Improvement;
Improvement.yieldTable = {
    'settlement': new yield_1.Yield({ food: 2, production: 2 }),
    'encampment': new yield_1.Yield({ production: 1 }),
    'farm': new yield_1.Yield({ food: 1 }),
    'forest': new yield_1.Yield({ food: 1 }),
};
Improvement.storeCapTable = {
    'settlement': { food: 20, production: 2 },
    'encampment': { food: 10, production: 1 },
    'farm': { food: 20 },
};
Improvement.naturalImprovementTable = {
    'forest': true,
};
Improvement.trainableUnitClassTable = {
    'settlement': [unit_1.PromotionClass.CIVILLIAN],
    'encampment': [unit_1.PromotionClass.MELEE, unit_1.PromotionClass.RANGED, unit_1.PromotionClass.RECON],
};
Improvement.researchableKnowledgeTable = {
    'campus': ['scout', 'r1', 'r2', 'r3', 'r4', 'r5'],
};
//# sourceMappingURL=improvement.js.map