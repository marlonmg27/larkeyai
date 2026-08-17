alter table public.users disable trigger users_prevent_protected_columns_update;
select public.test_set_active_subscription('189b3a5d-3f1d-4f1c-9b73-66dbb8a450c9'::uuid, '9a8cf744-0a65-4109-bd0e-6e944768e520'::uuid, 7000);
alter table public.users enable trigger users_prevent_protected_columns_update;