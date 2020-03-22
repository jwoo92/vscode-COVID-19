// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const https = require("https");
const countriesConfig = require("./countries");

const numberRegex = /\B(?=(\d{3})+(?!\d))/g;

class COVID19 {
  static arrayEq(arr1, arr2) {
    return arr1.length !== arr2.length
      ? false
      : arr1.every((item, i) => item === arr2[i]);
  }

  static cleanup(items) {
    items.forEach(item => {
      item.hide();
      item.dispose();
    });

    return items;
  }

  static createItem({
    color,
    key,
    loading = false,
    priority,
    text = "",
    tooltip,
    useColors
  }) {
    const item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      priority
    );

    item.text = loading ? "..." : text;
    if (useColors && color) item.color = color;
    if (tooltip) item.tooltip = `[${key}] ${tooltip}`;

    item.show();

    return item;
  }

  static async fetchData(country) {
    const isGlobal = country && country === "world";
    const { latest, locations } = await COVID19.httpGet(
      `https://coronavirus-tracker-api.herokuapp.com/v2/locations?source=jhu${
        isGlobal ? "" : `&country_code=${country}`
      }`
    ).catch(error => {
      throw new Error(`[${country}] Invalid response: ${error.message}`);
    });

    const lastUpdated = !isGlobal
      ? locations[0].last_updated
      : locations.reduce((a, b) =>
          a.last_updated > b.last_updated ? a.last_updated : b.last_updated
        );

    return {
      active: latest.confirmed - latest.recovered - latest.deaths,
      confirmed: latest.confirmed,
      deaths: latest.deaths,
      key: country,
      lastUpdated: `Last updated: ${new Date(lastUpdated).toLocaleString()}`,
      recovered: latest.recovered
    };
  }

  static formatCount(number) {
    return number.toString().replace(numberRegex, ",");
  }

  static httpGet(url) {
    return new Promise((resolve, reject) => {
      https.get(url, response => {
        let responseData = "";
        response.on("data", chunk => (responseData += chunk));
        response.on("end", () => {
          // Sometimes the 'error' event is not fired. Double check here.
          if (response.statusCode === 200) {
            resolve(JSON.parse(responseData));
          } else {
            reject("fail: " + response.statusCode);
          }
        });
      });
    });
  }

  constructor() {
    this.state = {
      refreshRate: 60000,
      items: new Map()
    };

    this.activate = this.activate.bind(this);
    this.deactivate = this.deactivate.bind(this);
    this.fillEmpty = this.fillEmpty.bind(this);
    this.refresh = this.refresh.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.refreshStats = this.refreshStats.bind(this);
  }

  activate(context) {
    this.refresh();

    setInterval(this.refresh, this.state.refreshRate);

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(this.refresh)
    );
  }

  deactivate() {}

  fillEmpty(countries) {
    this.state.items = new Map();
    let priority = 100;

    countries.forEach(key => {
      priority++;

      return this.state.items.set(
        key,
        COVID19.createItem({ text: key, priority, loading: true })
      );
    });
  }

  refresh() {
    const config = vscode.workspace.getConfiguration();
    const displayGlobal = config.get("COVID-19.displayGlobal");
    const configuredCountries = config
      .get("COVID-19.countries", [])
      .map(country => country.toUpperCase())
      .reverse();

    // check if should include overall stats
    if (displayGlobal) configuredCountries.push("world");

    if (!COVID19.arrayEq(configuredCountries, [...this.state.items.keys()])) {
      this.state.items = COVID19.cleanup(this.state.items);
      this.fillEmpty(configuredCountries);
    }

    this.refreshStats(configuredCountries);
  }

  refreshData(data) {
    const { formatCount } = COVID19;
    const active = formatCount(data.active);
    const confirmed = formatCount(data.confirmed);
    const deaths = formatCount(data.deaths);
    const recovered = formatCount(data.recovered);
    const item = this.state.items.get(data.key);
    const info = countriesConfig[data.key];

    item.text = `${info.emoji} ~${active} ✓${recovered} ✗${deaths}`;
    item.tooltip = `COVID-19 Tracker

${info.name}

Confirmed cases: ${confirmed}

~ = Active
✓ = Recovered
✗ = Deaths

${data.lastUpdated}`;
  }

  async refreshStats(countries) {
    if (!countries.length) {
      return;
    }

    const promises = countries.map(country => COVID19.fetchData(country));

    const res = await Promise.all(promises);
    res.forEach(this.refreshData);
  }
}

const { activate, deactivate } = new COVID19();

module.exports = {
  activate,
  deactivate
};
