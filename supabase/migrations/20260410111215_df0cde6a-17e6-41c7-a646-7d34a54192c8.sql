
REVOKE EXECUTE ON FUNCTION public.approve_chefs_table_request(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_approval(uuid, boolean, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_points(uuid, text, integer, text, text, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_referral_upgrade_bonus() FROM anon;
REVOKE EXECUTE ON FUNCTION public.wallet_credit(uuid, numeric, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.auto_create_user_wallet() FROM anon;
REVOKE EXECUTE ON FUNCTION public.audit_sensitive_access() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_role_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_sessions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_membership_trials() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_company_sensitive_fields(uuid) FROM anon;

UPDATE storage.buckets SET public = false WHERE name = 'knowledge-files';
