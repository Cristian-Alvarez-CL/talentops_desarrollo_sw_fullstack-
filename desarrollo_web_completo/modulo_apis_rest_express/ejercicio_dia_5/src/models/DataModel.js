const fs = require('fs').promises;
const path = require('path');

class DataModel {
  constructor(entity) {
    this.filePath = path.join(__dirname, `../../data/${entity}.json`);
  }

  async getAll() {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) { return []; }
  }

  async saveAll(data) {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }
}

module.exports = DataModel;