// Read-only Supabase management API inspection; never prints tokens or row data.
const project = 'kxgiipiaxwxmzuuskvjw';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error(
    'BLOCKED: SUPABASE_ACCESS_TOKEN is missing. Configure it securely, or connect the project-scoped Supabase MCP.',
  );
  process.exit(2);
}
const query = `select 'columns' as kind, table_schema as schema, table_name as object_name, column_name as detail, data_type as definition from information_schema.columns where table_schema in ('public','supabase_migrations')
union all select 'policy',schemaname,tablename,policyname,concat(cmd,': ',qual,' / ',with_check) from pg_policies where schemaname='public'
union all select 'constraint',n.nspname,c.relname,con.conname,pg_get_constraintdef(con.oid) from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
union all select 'function',n.nspname,p.proname,'security_definer='||p.prosecdef::text,pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f'
order by kind,schema,object_name,detail;`;
try {
  const response = await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, read_only: true }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    console.error(
      `BLOCKED: Supabase schema inspection returned HTTP ${response.status}. Check project-scoped management access; no schema changes were attempted.`,
    );
    process.exit(2);
  }
  const rows = await response.json();
  console.log(JSON.stringify({ project, schema_metadata: rows }, null, 2));
} catch {
  console.error('BLOCKED: Could not connect to the Supabase management API. Check network access.');
  process.exit(2);
}
