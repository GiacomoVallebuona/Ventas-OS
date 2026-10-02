alter table public.leads add column if not exists country text;
alter table public.leads add column if not exists city text;
alter table public.leads add column if not exists information_source text;

alter table public.preleads add column if not exists country text;
alter table public.preleads add column if not exists city text;
alter table public.preleads add column if not exists information_source text;

create or replace function public.vos_load(p_code text)
 returns table(data jsonb, updated_at timestamp with time zone)
 language sql
 security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'version', w.version,
    'updatedAt', to_char(w.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'goals', w.goals, 'ui', w.ui,
    'sourceDefs', coalesce(w.ui->'sourceDefs', '[]'::jsonb),
    'leads', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id,name,company,title,phone,country_code as "countryCode",whatsapp,email,website,address,
             country,city,hours_open as "hoursOpen", hours_close as "hoursClose", rating, reviews, category,
             industry,size,location,status,information_source as "informationSource",tags, coalesce(history,'[]'::jsonb) as history,
             to_char(created_at,'YYYY-MM-DD') as "createdAt", to_char(updated_at,'YYYY-MM-DD') as "updatedAt"
      from public.leads where workspace_id=w.id order by updated_at desc nulls last) t), '[]'::jsonb),
    'preleads', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id,name,company,title,phone,country_code as "countryCode",whatsapp,email,website,address,
             country,city,hours_open as "hoursOpen", hours_close as "hoursClose", rating, reviews, category,
             industry,size,location,status,information_source as "informationSource",tags, coalesce(history,'[]'::jsonb) as history,
             imported_from as "importedFrom",
             to_char(created_at,'YYYY-MM-DD') as "createdAt", to_char(updated_at,'YYYY-MM-DD') as "updatedAt"
      from public.preleads where workspace_id=w.id order by updated_at desc nulls last) t), '[]'::jsonb),
    'objectionDefs', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id,text from public.objection_defs where workspace_id=w.id) t), '[]'::jsonb),
    'calls', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select c.id, c.lead_id as "leadId", to_char(c.date,'YYYY-MM-DD') as date, c."time", c.duration,
             c.company,c.name,c.title,c.phone,c.whatsapp,c.email,c.website,c.industry,c.size,c.location,c.status,c.result,
             c.score, c.score_total as "scoreTotal", c.notes,
             coalesce((select jsonb_agg(co.objection_id) from public.call_objections co
                       where co.workspace_id=c.workspace_id and co.call_id=c.id), '[]'::jsonb) as objections
      from public.calls c where c.workspace_id=w.id order by c.date desc nulls last) t), '[]'::jsonb),
    'meetings', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id, lead_id as "leadId", title, to_char(date,'YYYY-MM-DD') as date, "time", status, description
      from public.meetings where workspace_id=w.id) t), '[]'::jsonb),
    'deals', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id,company,name,title,phone,email,industry,size,location,stage,
             to_char(created_at,'YYYY-MM-DD') as "createdAt"
      from public.deals where workspace_id=w.id) t), '[]'::jsonb),
    'knowledge', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id,cat,title,content,tags from public.knowledge where workspace_id=w.id) t), '[]'::jsonb),
    'days', coalesce((select jsonb_object_agg(to_char(day,'YYYY-MM-DD'),
                        jsonb_build_object('learnings',learnings,'improvements',improvements))
                      from public.journal_days where workspace_id=w.id), '{}'::jsonb)
  ) as data, w.updated_at
  from public.workspaces w where w.code = p_code;
$function$;

create or replace function public.vos_save(p_code text, p_data jsonb)
 returns timestamp with time zone
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare w_id uuid; v_ts timestamptz;
begin
  if p_code is null or length(p_code) < 12 then raise exception 'codigo invalido'; end if;

  insert into public.workspaces (code, goals, ui, version, updated_at)
  values (p_code, coalesce(p_data->'goals','{}'::jsonb),
          jsonb_set(coalesce(p_data->'ui','{}'::jsonb), '{sourceDefs}', coalesce(p_data->'sourceDefs','[]'::jsonb), true),
          coalesce((p_data->>'version')::int, 2), now())
  on conflict (code) do update
    set goals = excluded.goals, ui = excluded.ui, version = excluded.version, updated_at = now()
  returning id, updated_at into w_id, v_ts;

  delete from public.call_objections where workspace_id = w_id;
  delete from public.calls          where workspace_id = w_id;
  delete from public.leads          where workspace_id = w_id;
  delete from public.preleads       where workspace_id = w_id;
  delete from public.meetings       where workspace_id = w_id;
  delete from public.deals          where workspace_id = w_id;
  delete from public.objection_defs where workspace_id = w_id;
  delete from public.knowledge      where workspace_id = w_id;
  delete from public.journal_days   where workspace_id = w_id;

  insert into public.leads (workspace_id,id,name,company,title,phone,phone_norm,country_code,whatsapp,email,website,address,country,city,hours_open,hours_close,rating,reviews,category,industry,size,location,status,information_source,tags,history,created_at,updated_at)
  select w_id, e->>'id', e->>'name', e->>'company', e->>'title', e->>'phone',
         nullif(regexp_replace(coalesce(e->>'phone',''),'\\D','','g'),''),
         e->>'countryCode', e->>'whatsapp', e->>'email', e->>'website', e->>'address', e->>'country', e->>'city',
         e->>'hoursOpen', e->>'hoursClose', nullif(e->>'rating','')::numeric, nullif(e->>'reviews','')::int,
         e->>'category', e->>'industry', e->>'size', e->>'location', e->>'status', e->>'informationSource', e->>'tags',
         case when jsonb_typeof(e->'history')='array' then e->'history' else '[]'::jsonb end,
         nullif(e->>'createdAt','')::date, nullif(e->>'updatedAt','')::date
  from jsonb_array_elements(coalesce(p_data->'leads','[]'::jsonb)) e
  where coalesce(e->>'id','') <> '' on conflict do nothing;

  insert into public.preleads (workspace_id,id,name,company,title,phone,phone_norm,country_code,whatsapp,email,website,address,country,city,hours_open,hours_close,rating,reviews,category,industry,size,location,status,information_source,tags,history,imported_from,created_at,updated_at)
  select w_id, e->>'id', e->>'name', e->>'company', e->>'title', e->>'phone',
         nullif(regexp_replace(coalesce(e->>'phone',''),'\\D','','g'),''),
         e->>'countryCode', e->>'whatsapp', e->>'email', e->>'website', e->>'address', e->>'country', e->>'city',
         e->>'hoursOpen', e->>'hoursClose', nullif(e->>'rating','')::numeric, nullif(e->>'reviews','')::int,
         e->>'category', e->>'industry', e->>'size', e->>'location', e->>'status', e->>'informationSource', e->>'tags',
         case when jsonb_typeof(e->'history')='array' then e->'history' else '[]'::jsonb end, e->>'importedFrom',
         nullif(e->>'createdAt','')::date, nullif(e->>'updatedAt','')::date
  from jsonb_array_elements(coalesce(p_data->'preleads','[]'::jsonb)) e
  where coalesce(e->>'id','') <> '' on conflict do nothing;

  insert into public.objection_defs (workspace_id,id,text)
  select w_id, e->>'id', e->>'text' from jsonb_array_elements(coalesce(p_data->'objectionDefs','[]'::jsonb)) e
  where coalesce(e->>'id','') <> '' on conflict do nothing;

  insert into public.calls (workspace_id,id,lead_id,date,"time",duration,company,name,title,phone,whatsapp,email,website,industry,size,location,status,result,score,score_total,notes)
  select w_id, e->>'id', nullif(e->>'leadId',''), nullif(e->>'date','')::date, e->>'time', e->>'duration',
         e->>'company', e->>'name', e->>'title', e->>'phone', e->>'whatsapp', e->>'email', e->>'website',
         e->>'industry', e->>'size', e->>'location', e->>'status', e->>'result',
         case when jsonb_typeof(e->'score')='object' then e->'score' else null end, nullif(e->>'scoreTotal','')::int, e->>'notes'
  from jsonb_array_elements(coalesce(p_data->'calls','[]'::jsonb)) e
  where coalesce(e->>'id','') <> '' on conflict do nothing;

  insert into public.call_objections (workspace_id,call_id,objection_id)
  select w_id, e->>'id', obj from jsonb_array_elements(coalesce(p_data->'calls','[]'::jsonb)) e,
       jsonb_array_elements_text(coalesce(e->'objections','[]'::jsonb)) obj
  where coalesce(e->>'id','') <> '' and coalesce(obj,'') <> '' on conflict do nothing;

  insert into public.meetings (workspace_id,id,lead_id,title,date,"time",status,description)
  select w_id, e->>'id', nullif(e->>'leadId',''), e->>'title', nullif(e->>'date','')::date, e->>'time', e->>'status', e->>'description'
  from jsonb_array_elements(coalesce(p_data->'meetings','[]'::jsonb)) e
  where coalesce(e->>'id','') <> '' on conflict do nothing;

  insert into public.deals (workspace_id,id,company,name,title,phone,email,industry,size,location,stage,created_at)
  select w_id, e->>'id', e->>'company', e->>'name', e->>'title', e->>'phone', e->>'email', e->>'industry', e->>'size', e->>'location', e->>'stage', nullif(e->>'createdAt','')::date
  from jsonb_array_elements(coalesce(p_data->'deals','[]'::jsonb)) e
  where coalesce(e->>'id','') <> '' on conflict do nothing;

  insert into public.knowledge (workspace_id,id,cat,title,content,tags)
  select w_id, e->>'id', e->>'cat', e->>'title', e->>'content', e->>'tags'
  from jsonb_array_elements(coalesce(p_data->'knowledge','[]'::jsonb)) e
  where coalesce(e->>'id','') <> '' on conflict do nothing;

  insert into public.journal_days (workspace_id,day,learnings,improvements)
  select w_id, d.key::date, d.value->>'learnings', d.value->>'improvements'
  from jsonb_each(coalesce(p_data->'days','{}'::jsonb)) d
  where coalesce(d.key,'') <> '' and (coalesce(d.value->>'learnings','') <> '' or coalesce(d.value->>'improvements','') <> '')
  on conflict do nothing;

  return v_ts;
end;
$function$;
