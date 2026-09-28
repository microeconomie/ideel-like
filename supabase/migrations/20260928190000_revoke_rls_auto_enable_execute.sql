-- Project-wide hygiene: rls_auto_enable is only meant to run from the "ensure_rls" event trigger,
-- which doesn't need EXECUTE for API roles; don't expose it through the Data API.

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
