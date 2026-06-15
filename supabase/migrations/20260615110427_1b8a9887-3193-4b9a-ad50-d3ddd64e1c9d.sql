
-- Fix function search_path & execute permissions
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Tighten public-insert policies: scope to expected columns
DROP POLICY IF EXISTS "rfqs public insert" ON public.rfqs;
CREATE POLICY "rfqs public insert" ON public.rfqs FOR INSERT TO anon, authenticated
  WITH CHECK (length(contact_name) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 255 AND status = 'new');

DROP POLICY IF EXISTS "rfq_items public insert" ON public.rfq_items;
CREATE POLICY "rfq_items public insert" ON public.rfq_items FOR INSERT TO anon, authenticated
  WITH CHECK (length(product_name) BETWEEN 1 AND 300 AND quantity > 0 AND quantity < 100000);

DROP POLICY IF EXISTS "leads public insert" ON public.leads;
CREATE POLICY "leads public insert" ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 255 AND length(message) BETWEEN 1 AND 5000);
