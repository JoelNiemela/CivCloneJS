"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Leader = exports.leaderTemplates = void 0;
exports.leaderTemplates = [
    { color: '#820000', textColor: '#ccc', name: 'Rokun' },
    { color: '#0a2ead', textColor: '#ccc', name: 'Azura' },
    { color: '#03a300', textColor: '#222', name: 'Vertos' },
    { color: '#bd9a02', textColor: '#222', name: 'Solei' },
    { color: '#560e8a', textColor: '#ccc', name: 'Imperius' },
    { color: '#bd7400', textColor: '#333', name: 'Baranog' }, // ORANGE
];
class Leader {
    constructor(id) {
        const { color, textColor, name } = exports.leaderTemplates[id];
        this.id = id;
        this.color = color;
        this.textColor = textColor;
        this.secondaryColor = color;
        this.name = name;
        this.civID = null;
    }
    static import(data) {
        const leader = new Leader(data.id);
        leader.color = data.color;
        leader.textColor = data.textColor;
        leader.secondaryColor = data.secondaryColor;
        leader.name = data.name;
        leader.civID = null;
        return leader;
    }
    select(civID) {
        this.civID = civID;
    }
    unselect() {
        this.civID = null;
    }
    isTaken() {
        return this.civID !== null;
    }
    getData() {
        return {
            id: this.id,
            color: this.color,
            textColor: this.textColor,
            secondaryColor: this.secondaryColor,
            name: this.name,
            civID: this.civID,
        };
    }
}
exports.Leader = Leader;
//# sourceMappingURL=leader.js.map