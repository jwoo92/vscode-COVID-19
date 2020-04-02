jest.mock('https');
jest.mock('vscode');
jest.mock('novelcovid');

const https = require('https');
const covid = require('novelcovid');
const COVID19 = require('../extension');
const vscode = require('../__mocks__/vscode.mock');

jest.useFakeTimers();
const date = new Date('2020-01-01T05:00:00.00Z');
jest.spyOn(global, 'Date').mockImplementation(() => date);

beforeEach(() => {
  jest.resetModules();
});

function getMockData() {
  return {
    latest: {
      confirmed: 304524,
      deaths: 12973,
      recovered: 91499,
    },
    locations: [
      {
        coordinates: {
          latitude: '1.2833',
          longitude: '103.8333',
        },
        country: 'Singapore',
        country_code: 'SG',
        id: 2,
        last_updated: '2020-03-22T22:02:45.979279Z',
        latest: {
          confirmed: 432,
          deaths: 2,
          recovered: 140,
        },
        province: '',
      },
      {
        coordinates: {
          latitude: '15',
          longitude: '101',
        },
        country: 'Thailand',
        country_code: 'TH',
        id: 0,
        last_updated: '2020-03-22T22:02:45.974112Z',
        latest: {
          confirmed: 411,
          deaths: 1,
          recovered: 42,
        },
        province: '',
      },
      {
        coordinates: {
          latitude: '36',
          longitude: '138',
        },
        country: 'Japan',
        country_code: 'JP',
        id: 1,
        // last_updated: '2020-03-22T22:02:45.967610Z',
        last_updated: '2020-03-22T22:14:15.460Z',
        latest: {
          confirmed: 1007,
          deaths: 35,
          recovered: 232,
        },
        province: '',
      },
    ],
  };
}

function createNewConfig(props = {}) {
  class Configuration {
    constructor(config) {
      this.config = {
        'COVID-19.displayGlobal': config.displayGlobal || false,
        'COVID-19.countries': config.countries || ['US'],
      };

      this.get = this.get.bind(this);
    }

    get(property) {
      return this.config[property];
    }
  }

  return new Configuration(props);
}

let plugin = null;

beforeEach(() => {
  plugin = new COVID19();
});

test('COVID19', () => {
  expect(new COVID19()).toBeTruthy();
});

test('arrayEq', () => {
  expect(COVID19.arrayEq([1, 2, 3], [1, 2, 3])).toBeTruthy();
  expect(COVID19.arrayEq([1, 2], [1, 2, 3])).toBeFalsy();
});

test('cleanup', () => {
  const hide = jest.fn();
  const dispose = jest.fn();
  const mapMock = new Map();

  mapMock.set('item', { hide, dispose });
  const res = COVID19.cleanup(mapMock);

  expect(res).toEqual(mapMock);
  expect(hide).toHaveBeenCalled();
  expect(dispose).toHaveBeenCalled();
});

test('createItem', () => {
  const item = COVID19.createItem({
    loading: true,
    color: 'blue',
    tooltip: 'test tooltip',
    key: 'key',
  });

  const item2 = COVID19.createItem({ text: 'test' });

  expect(item.text).toBe('...');
  expect(item2.text).toBe('test');
  expect(item.color).toBe('blue');
  expect(item.tooltip).toBe('[key] test tooltip');
});

test('getAll', async () => {
  covid.getAll = jest.fn().mockReturnValue({
    cases: 935840,
    deaths: 47241,
    recovered: 194286,
    updated: 1585795703537,
    active: 694313,
    affectedCountries: 205,
  });

  const response = await COVID19.getAll('Global');

  expect(response).toEqual({
    active: '694,313',
    affectedCountries: '205',
    cases: '935,840',
    deaths: '47,241',
    emoji: '🌎',
    key: 'Global',
    name: 'Global',
    recovered: '194,286',
    updated: 'Last updated: 1/1/2020, 12:00:00 AM',
  });
});

test('getCountry', async () => {
  covid.getCountry = jest.fn().mockReturnValue({
    country: 'USA',
    countryInfo: {
      _id: 840,
      iso2: 'US',
      iso3: 'USA',
      lat: 38,
      long: -97,
      flag: 'https://raw.githubusercontent.com/NovelCOVID/API/master/assets/flags/us.png',
    },
    cases: 215175,
    todayCases: 172,
    deaths: 5110,
    todayDeaths: 8,
    recovered: 8878,
    active: 201187,
    critical: 5005,
    casesPerOneMillion: 650,
    deathsPerOneMillion: 15,
    updated: 1585795703594,
  });

  const response = await COVID19.getCountry('US', 'key');

  expect(response).toEqual({
    active: '201,187',
    cases: '215,175',
    casesPerOneMillion: '650',
    critical: '5,005',
    deaths: '5,110',
    deathsPerOneMillion: '15',
    emoji: '🇺🇸',
    key: 'key',
    name: 'United States',
    recovered: '8,878',
    todayCases: '172',
    todayDeaths: '8',
    updated: 'Last updated: 1/1/2020, 12:00:00 AM',
  });
});

test('getState', async () => {
  covid.getState = jest.fn().mockReturnValue({
    state: 'Ohio',
    cases: 2547,
    todayCases: 0,
    deaths: 65,
    todayDeaths: 0,
    active: 2482,
  });

  const response = await COVID19.getState('OH-US', 'key');
  expect(response).toEqual({
    active: '2,482',
    cases: '2,547',
    deaths: '65',
    emoji: '🇺🇸(key)',
    key: 'key',
    name: 'OH-US',
    recovered: '0',
    todayCases: '0',
    todayDeaths: '0',
    updated: 'Last updated: 1/1/2020, 12:00:00 AM',
  });
});

test('fetchData', async () => {
  COVID19.getAll = jest.fn().mockReturnValueOnce('GlobalFn');
  COVID19.getCountry = jest.fn().mockReturnValueOnce('countryFn');
  COVID19.getState = jest.fn().mockReturnValueOnce('stateFn');

  const globalResponse = await COVID19.fetchData('Global');
  expect(globalResponse).toEqual('GlobalFn');

  const countryResponse = await COVID19.fetchData('TH');
  expect(countryResponse).toEqual('countryFn');

  const stateResponse = await COVID19.fetchData('OH-US');
  expect(stateResponse).toEqual('stateFn');
});

test('formatCount', () => {
  expect(COVID19.formatCount(100)).toBe('100');
  expect(COVID19.formatCount(123456)).toBe('123,456');
});

test('activate', async () => {
  plugin.refresh = jest.fn();

  const response = await plugin.activate({
    subscriptions: {
      push: jest.fn(),
    },
  });

  expect(response).toBeUndefined();
});

test('deactivate', () => {
  expect(plugin.deactivate()).toBeUndefined();
});

test('fillEmpty', () => {
  expect(plugin.state.items.get('US')).toBeUndefined();
  plugin.fillEmpty(['US', 'CN']);
  expect(plugin.state.items.get('US')).not.toBeUndefined();
});

test('refresh', () => {
  const refreshStats = jest.fn();
  COVID19.cleanup = jest.fn();
  plugin.refreshStats = refreshStats;
  vscode.workspace.getConfiguration = jest.fn().mockReturnValue(createNewConfig());

  expect(plugin.refresh()).toBeUndefined();

  COVID19.arrayEq = jest.fn(() => true);
  vscode.workspace.getConfiguration = jest.fn().mockReturnValue(
    createNewConfig({
      displayGlobal: true,
      countries: [],
    }),
  );

  expect(plugin.refresh()).toBeUndefined();
  expect(refreshStats).toHaveBeenCalled();
});

test('refreshData', () => {
  plugin.state.items.set('US', { name: 'United States' });

  plugin.refreshData({
    active: 7,
    cases: 10,
    deaths: 1,
    name: 'United States',
    key: 'US',
    updated: 'Last updated: 3/22/2020, 7:12:00 PM',
    recovered: 2,
    emoji: '🇺🇸',
  });
  const item = plugin.state.items.get('US');

  expect(item.text).toBe('🇺🇸 ~7 ✓2 ✗1');
  expect(item.name).toBe('United States');
  expect(item.tooltip).toBe(`COVID-19 Tracker

United States

Confirmed cases: 10

~ = Active
✓ = Recovered
✗ = Deaths

Last updated: 3/22/2020, 7:12:00 PM`);
});

test('refreshStats', async () => {
  COVID19.fetchData = jest.fn();
  plugin.refreshData = jest.fn();
  const res = await plugin.refreshStats([]);

  expect(res).toBeUndefined();

  const resWithCountries = await plugin.refreshStats(['US', 'CN']);

  expect(resWithCountries).toBe();
  expect(COVID19.fetchData).toBeCalledTimes(2);
  expect(plugin.refreshData).toBeCalledTimes(2);
});
