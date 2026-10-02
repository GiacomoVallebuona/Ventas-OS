import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, root), "utf8");

test("lead fields are wired through UI, state, import/export and Supabase", () => {
  const core = read("js/core.js");
  const leads = read("js/leads.js");
  const calls = read("js/calls.js");
  const app = read("js/app.js");
  const migration = read("supabase/migrations/20261001_add_lead_location_source.sql");

  assert.match(core, /LEAD_GEO_OPTIONS/);
  assert.match(core, /sourceDefs/);
  assert.match(leads, /leadView\.city/);
  assert.match(leads, /leadView\.country/);
  assert.match(leads, /leadView\.informationSource/);
  assert.match(leads, /informationSource/);
  assert.match(leads, /imp\.defaults/);
  assert.match(leads, /id="impCountry"/);
  assert.match(leads, /id="impCity"/);
  assert.match(leads, /id="impInformationSource"/);
  assert.match(leads, /rememberInformationSource\(o\.informationSource\)/);
  assert.match(leads, /country/);
  assert.match(leads, /city/);
  assert.match(calls, /id="l_country"/);
  assert.match(calls, /id="l_city"/);
  assert.match(calls, /id="l_informationSource"/);
  assert.match(calls, /id="p_informationSource"/);
  assert.match(calls, /function readPreleadForm/);
  assert.match(app, /leadCountryFilter/);
  assert.match(app, /leadCityFilter/);
  assert.match(app, /leadSourceFilter/);
  assert.match(migration, /alter table public\.leads add column if not exists city text/i);
  assert.match(migration, /alter table public\.preleads add column if not exists city text/i);
  assert.match(migration, /information_source/i);
  assert.match(migration, /create or replace function public\.vos_load/i);
  assert.match(migration, /create or replace function public\.vos_save/i);
});
