const vscode = require('vscode');
const covid = require('novelcovid');
const { countries: countriesConfig } = require('./config');

const countryRegex = /(^.+\()([A-Z]{2})\)/g;
const numberRegex = /(\d)(?=(\d\d\d)+$)/;
const stateRegex = /^\W+ {1}([a-z]+).+$/i;
const stateCodeRegex = /^.+\(([A-Z]{2}).+$/i;

class COVID19 {
  static arrayEq(arr1, arr2) {
    return arr1.length !== arr2.length ? false : arr1.every((item, i) => item === arr2[i]);
  }

  static cleanup(items) {
    items.forEach((item) => {
      item.hide();
      item.dispose();
    });

    return items;
  }

  static createItem({ color, key, loading = false, priority, text = '', tooltip }) {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, priority);

    item.text = loading ? '...' : text;
    if (color) item.color = color;
    if (tooltip) item.tooltip = `[${key}] ${tooltip}`;

    item.show();

    return item;
  }

  static async fetchData(tracker) {
    if (tracker.indexOf('Global') > -1) return COVID19.getAll(tracker);

    const countryCode = tracker.replace(countryRegex, '$2');
    if (countryCode.length === 2) return COVID19.getCountry(countryCode, tracker);

    return COVID19.getState(tracker.replace(stateRegex, '$1'), tracker);
  }

  static formatCount(number) {
    return number.toString().replace(numberRegex, '$1,');
  }

  static async getAll(id) {
    const { updated, ...data } = await covid.getAll();

    const response = Object.keys(data).reduce((props, key) => {
      props[key] = COVID19.formatCount(data[key]);
      return props;
    }, {});

    return {
      ...response,
      key: id,
      emoji: '🌎',
      name: 'Global',
      updated: `Last updated: ${new Date(updated).toLocaleString()}`,
    };
  }

  static async getCountry(countryCode, id) {
    const data = await covid.getCountry({ country: countryCode });
    const info = countriesConfig[countryCode];

    return Object.keys(data).reduce(
      (props, key) => {
        const val = data[key];

        if (key === 'updated') {
          props[key] = `Last updated: ${new Date(val).toLocaleString()}`;
          return props;
        }

        if (typeof val === 'number') props[key] = COVID19.formatCount(val);

        return props;
      },
      { key: id, emoji: info.emoji, name: info.name },
    );
  }

  static async getState(state, id) {
    const data = await covid.getState({ state });

    const response = Object.keys(data).reduce((props, key) => {
      const val = data[key];

      if (typeof val === 'number') props[key] = COVID19.formatCount(val);

      return props;
    }, {});

    return {
      ...response,
      key: id,
      emoji: `🇺🇸(${id.replace(stateCodeRegex, '$1')})`,
      name: state,
      recovered: COVID19.formatCount(data.cases - data.active - data.deaths),
      updated: `Last updated: ${new Date().toLocaleString()}`,
    };
  }

  constructor() {
    this.state = {
      refreshRate: 60000,
      items: new Map(),
    };

    this.activate = this.activate.bind(this);
    this.deactivate = this.deactivate.bind(this);
    this.fillEmpty = this.fillEmpty.bind(this);
    this.refresh = this.refresh.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.refreshStats = this.refreshStats.bind(this);
  }

  async activate(context) {
    this.refresh();
    setInterval(this.refresh, this.state.refreshRate);
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(this.refresh));
  }

  deactivate() {}

  fillEmpty(items) {
    this.state.items = new Map();
    let priority = 100;

    items.forEach((key) => {
      priority += 1;
      return this.state.items.set(key, COVID19.createItem({ text: key, priority, loading: true }));
    });
  }

  refresh() {
    const config = vscode.workspace.getConfiguration();
    const trackers = [
      config.get('FirstTracker'),
      config.get('SecondTracker'),
      config.get('ThirdTracker'),
    ]
      .filter((tracker, i, self) => tracker !== 'Disabled' && self.indexOf(tracker) === i)
      .reverse();

    if (!COVID19.arrayEq(trackers, [...this.state.items.keys()])) {
      this.state.items = COVID19.cleanup(this.state.items);
      this.fillEmpty(trackers);
    }

    this.refreshStats(trackers);
  }

  refreshData(data) {
    const { cases: confirmed, active, deaths, recovered, emoji, name, key } = data;
    const item = this.state.items.get(key);

    item.text = `${emoji} ~${active} ✓${recovered} ✗${deaths}`;
    item.tooltip = `COVID-19 Tracker

${name}

Confirmed cases: ${confirmed}

~ = Active
✓ = Recovered
✗ = Deaths

${data.updated}`;
  }

  async refreshStats(trackers) {
    if (!trackers.length) return;

    const res = await Promise.all(trackers.map(COVID19.fetchData));
    res.forEach(this.refreshData);
  }
}

module.exports = COVID19;
