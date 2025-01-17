import { Trader } from '../trade';
import { ErrandAction, ErrandData, ErrandType, WorkErrand } from './errand';
import { Knowledge, KnowledgeBranch } from './knowledge';
import { PromotionClass } from './unit';
import { ResourceStore, Yield, YieldParams } from './yield';

export type ImprovementData = {
  type: string;
  pillaged: boolean;
  storage: YieldParams;
  errand?: ErrandData;
  metadata?: any;
  isNatural: boolean;
};

export interface ImprovementConstructionCost {
  type: string;
  cost: Yield;
}

export class Improvement {
  static yieldTable: { [improvement: string]: Yield } = {
    'settlement': new Yield({food: 2, production: 2}),
    'encampment': new Yield({production: 1}),
  
    'farm': new Yield({food: 1}),
  
    'forest': new Yield({food: 1}),
  };
  
  static storeCapTable: { [improvement: string]: YieldParams } = {
    'settlement': {food: 20, production: 2},
    'encampment': {food: 10, production: 1},
  
    'farm': {food: 20},
  };
  
  static naturalImprovementTable: { [improvement: string]: boolean } = {
    'forest': true,
  };

  static improvementHeightTable: { [improvement: string]: number } = {
    'forest': 5,
  }

  static trainableUnitClassTable: { [improvement: string]: PromotionClass[] } = {
    'settlement': [PromotionClass.CIVILLIAN],
    'encampment': [PromotionClass.MELEE, PromotionClass.RANGED, PromotionClass.RECON],
  };

  static researchableKnowledgeBranchTable: { [improvement: string]: KnowledgeBranch[] } = {
    'campus': [KnowledgeBranch.OFFENSE, KnowledgeBranch.DEFESNSE, KnowledgeBranch.CIVICS, KnowledgeBranch.DEVELOPMENT],
  };

  type: string;
  pillaged: boolean;
  yield: Yield;
  isNatural: boolean;
  errand?: WorkErrand;
  metadata: any;

  protected traders: Trader[];
  protected suppliers: Trader[];
  protected storage: ResourceStore;

  static makeCatalog(types: string[]): ImprovementConstructionCost[] {
    return types.map(type => (
      { type, cost: WorkErrand.errandCostTable[ErrandType.CONSTRUCTION][type] }
    ));
  }
  
  constructor(type?: string, baseYield?: Yield, metadata?: any) {
    if (!(type && baseYield)) return;
    this.type = type;
    this.pillaged = false;
    this.isNatural = Improvement.naturalImprovementTable[type];
    this.yield = baseYield.add(Improvement.yieldTable[type] ?? new Yield({}));
    this.metadata = metadata;
    this.storage = new ResourceStore(Improvement.storeCapTable[type] ?? {});
    this.traders = [];
    this.suppliers = [];
    if (this.isNatural) {
      this.yield = new Yield({});
    }// else if (type === 'worksite') {
    //   this.yield = new Yield({});
      
    // }
  }

  export() {
    return {
      type: this.type,
      pillaged: this.pillaged,
      isNatural: this.isNatural,
      yield: this.yield,
      storage: this.storage,
      errand: this.errand?.export(),
    };
  }

  static import(data: any): Improvement {
    const improvement = new Improvement();
    improvement.type = data.type;
    improvement.pillaged = data.pillaged;
    improvement.isNatural = data.isNatural;
    improvement.yield = new Yield(data.yield);
    const storageCap = data.storage.capacity;
    delete data.storage.capacity;
    improvement.storage = new ResourceStore(storageCap).incr(new Yield(data.storage)) as ResourceStore;
    if (data.errand) improvement.errand = WorkErrand.import(improvement.storage, data.errand);
    improvement.traders = [];
    improvement.suppliers = [];
    return improvement;
  }

  getData(): ImprovementData {
    return {
      type: this.type,
      pillaged: this.pillaged,
      storage: this.storage,
      errand: this.errand?.getData(),
      isNatural: this.isNatural,
    };
  }

  /**
   * 
   * @returns list of units classes this improvement knows how to train
   */
  getTrainableUnitClasses(): PromotionClass[] {
    return Improvement.trainableUnitClassTable[this.type] ?? [];
  }

  /**
   * 
   * @returns list of knowledge branches this improvement knows how to research
   */
  getResearchableKnowledgeBranches(): KnowledgeBranch[] {
    return Improvement.researchableKnowledgeBranchTable[this.type] ?? [];
  }

  /**
   * 
   * @returns list of knowledges this improvement knows how to research
   */
  getResearchableKnowledgeNames(): string[] {
    const researchableBranches = this.getResearchableKnowledgeBranches().reduce((obj, branch) => ({ ...obj, [branch]: true }), {});
    return Knowledge.getKnowledgeList().filter(({ branch }) => researchableBranches[branch]).map(({ name }) => name);
  }

  startErrand(errand: ErrandAction) {
    this.errand = new WorkErrand(this.storage, errand);
  }

  work(): void {
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

    this.store(this.yield);
    this.storage.cap();
  }

  store(resources: Yield): void {
    this.storage.incr(resources);
    this.errand?.storedThisTurn.incr(resources);
  }

  subscribeTrader(trader: Trader): void {
    this.traders.push(trader);
  }

  subscribeSupplier(trader: Trader): void {
    this.suppliers.push(trader);
  }
}

export interface Worksite extends Improvement {
  errand: WorkErrand;
}
