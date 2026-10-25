-- Tighten application RPC grants after initial deployment.
-- Internal trigger functions must never be directly callable by API roles.
revoke execute on function public.tasketh_handle_new_user() from anon, authenticated, service_role;
revoke execute on function public.tasketh_touch_row() from anon, authenticated, service_role;
revoke execute on function public.tasketh_check_availability() from anon, authenticated, service_role;
-- API functions requiring auth.uid() should not be executable anonymously.
revoke execute on function public.complete_recommendation(text,jsonb) from anon;
revoke execute on function public.finish_onboarding() from anon;
revoke execute on function public.reserve_recommendation(text) from anon;
revoke execute on function public.replace_weekly_availability(jsonb,boolean) from anon;
-- tasketh_username_available(text) is intentionally accessible to anon before signup.
