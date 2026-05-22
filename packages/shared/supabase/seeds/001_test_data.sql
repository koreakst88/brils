-- Seeds for testing admin dashboard
-- Location: packages/shared/supabase/seeds/001_test_data.sql

DO $$
DECLARE
  -- distributor IDs
  dist_ivanov_id UUID;
  dist_petrov_id UUID;
  dist_sidorov_id UUID;
  dist_vasiliev_id UUID;
  dist_seoul_id UUID;

  -- admin and owner IDs
  admin_id UUID;
  owner_id UUID;

  -- order IDs
  order_ids UUID[] := '{}';
  o_id UUID;

  -- lead IDs
  lead_ids UUID[] := '{}';
  l_id UUID;
BEGIN
  -- 0. Clean up existing tables to ensure clean seed
  TRUNCATE public.activity_log, public.payments, public.inventory_transactions, public.orders, public.leads, public.pricing, public.users CASCADE;

  -- 1. Create Admin and Owner users for activity log associations
  INSERT INTO public.users (telegram_id, name, role, created_at)
  VALUES 
    (999999, 'System Admin', 'admin', NOW() - INTERVAL '90 days')
  RETURNING id INTO admin_id;

  INSERT INTO public.users (telegram_id, name, role, created_at)
  VALUES 
    (888888, 'System Owner', 'owner', NOW() - INTERVAL '90 days')
  RETURNING id INTO owner_id;

  -- 2. Create Distributors (5 records in users with role='user')
  INSERT INTO public.users (telegram_id, name, role, created_at)
  VALUES (100001, 'ИП Иванов (KZ)', 'user', NOW() - INTERVAL '85 days')
  RETURNING id INTO dist_ivanov_id;

  INSERT INTO public.users (telegram_id, name, role, created_at)
  VALUES (100002, 'ИП Петров (UZ)', 'user', NOW() - INTERVAL '60 days')
  RETURNING id INTO dist_petrov_id;

  INSERT INTO public.users (telegram_id, name, role, created_at)
  VALUES (100003, 'ИП Сидоров (KG)', 'user', NOW() - INTERVAL '45 days')
  RETURNING id INTO dist_sidorov_id;

  INSERT INTO public.users (telegram_id, name, role, created_at)
  VALUES (100004, 'ИП Васильев (TM)', 'user', NOW() - INTERVAL '30 days')
  RETURNING id INTO dist_vasiliev_id;

  INSERT INTO public.users (telegram_id, name, role, created_at)
  VALUES (100005, 'Seoul Trading Co. (KR)', 'user', NOW() - INTERVAL '15 days')
  RETURNING id INTO dist_seoul_id;

  -- 3. Create Leads (15 records)
  -- 3 KZ
  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200001, 'KZ', 'wholesale', ARRAY['bb-cream', 'salmon-cream'], 'google', 'cpc', 'promo_kz', NOW() - INTERVAL '13 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200002, 'KZ', 'distribution', ARRAY['multi-balm'], 'telegram', 'social', 'channel_ads', NOW() - INTERVAL '11 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200003, 'KZ', 'cooperation', ARRAY['sleeping-mask', 'bb-cream'], 'yandex', 'organic', 'search', NOW() - INTERVAL '10 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  -- 3 UZ
  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200004, 'UZ', 'wholesale', ARRAY['salmon-cream'], 'facebook', 'cpc', 'fb_uz', NOW() - INTERVAL '9 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200005, 'UZ', 'selection', ARRAY['multi-balm', 'sleeping-mask'], 'google', 'organic', 'search', NOW() - INTERVAL '8 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200006, 'UZ', 'cooperation', ARRAY['bb-cream'], 'instagram', 'social', 'insta_promo', NOW() - INTERVAL '7 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  -- 3 KG
  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200007, 'KG', 'distribution', ARRAY['sleeping-mask'], 'google', 'cpc', 'promo_kg', NOW() - INTERVAL '6 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200008, 'KG', 'wholesale', ARRAY['multi-balm', 'salmon-cream'], 'telegram', 'social', 'channel_ads', NOW() - INTERVAL '5 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200009, 'KG', 'selection', ARRAY['bb-cream'], 'yandex', 'organic', 'search', NOW() - INTERVAL '4 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  -- 3 TM
  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200010, 'TM', 'cooperation', ARRAY['multi-balm'], 'direct', 'none', 'direct_visit', NOW() - INTERVAL '4 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200011, 'TM', 'wholesale', ARRAY['sleeping-mask', 'bb-cream'], 'google', 'cpc', 'promo_tm', NOW() - INTERVAL '3 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200012, 'TM', 'distribution', ARRAY['salmon-cream'], 'telegram', 'social', 'channel_ads', NOW() - INTERVAL '2 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  -- 3 Other
  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200013, 'Other', 'wholesale', ARRAY['bb-cream'], 'facebook', 'cpc', 'fb_global', NOW() - INTERVAL '2 days') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200014, 'Other', 'cooperation', ARRAY['multi-balm', 'sleeping-mask'], 'instagram', 'social', 'insta_global', NOW() - INTERVAL '1 day') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  INSERT INTO public.leads (telegram_id, country, intent, products, utm_source, utm_medium, utm_campaign, created_at)
  VALUES (200015, 'Other', 'selection', ARRAY['salmon-cream'], 'google', 'organic', 'search', NOW() - INTERVAL '5 hours') RETURNING id INTO l_id;
  lead_ids := array_append(lead_ids, l_id);

  -- 4. Pricing (4 records)
  INSERT INTO public.pricing (product, price, created_at) VALUES ('bb-cream', 2.50, NOW() - INTERVAL '90 days');
  INSERT INTO public.pricing (product, price, created_at) VALUES ('salmon-cream', 4.00, NOW() - INTERVAL '90 days');
  INSERT INTO public.pricing (product, price, created_at) VALUES ('multi-balm', 1.50, NOW() - INTERVAL '90 days');
  INSERT INTO public.pricing (product, price, created_at) VALUES ('sleeping-mask', 3.00, NOW() - INTERVAL '90 days');

  -- 5. Orders (12 records)
  -- Order 1: dist_ivanov_id, delivered
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at, shipped_at)
  VALUES (
    dist_ivanov_id, 
    '[{"product": "bb-cream", "quantity": 1000, "price": 2.50}, {"product": "sleeping-mask", "quantity": 500, "price": 3.00}]'::jsonb,
    4000.00, 
    'delivered', 
    NOW() - INTERVAL '55 days', 
    NOW() - INTERVAL '53 days'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);

  -- Order 2: dist_ivanov_id, shipped
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at, shipped_at)
  VALUES (
    dist_ivanov_id, 
    '[{"product": "salmon-cream", "quantity": 500, "price": 4.00}]'::jsonb,
    2000.00, 
    'shipped', 
    NOW() - INTERVAL '35 days', 
    NOW() - INTERVAL '33 days'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);

  -- Order 3: dist_ivanov_id, processing
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at)
  VALUES (
    dist_ivanov_id, 
    '[{"product": "multi-balm", "quantity": 1000, "price": 1.50}]'::jsonb,
    1500.00, 
    'processing', 
    NOW() - INTERVAL '10 days'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);

  -- Order 4: dist_petrov_id, delivered
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at, shipped_at)
  VALUES (
    dist_petrov_id, 
    '[{"product": "bb-cream", "quantity": 800, "price": 2.50}]'::jsonb,
    2000.00, 
    'delivered', 
    NOW() - INTERVAL '48 days', 
    NOW() - INTERVAL '46 days'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);

  -- Order 5: dist_petrov_id, processing
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at)
  VALUES (
    dist_petrov_id, 
    '[{"product": "salmon-cream", "quantity": 300, "price": 4.00}, {"product": "sleeping-mask", "quantity": 200, "price": 3.00}]'::jsonb,
    1800.00, 
    'processing', 
    NOW() - INTERVAL '8 days'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);

  -- Order 6: dist_petrov_id, new
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at)
  VALUES (
    dist_petrov_id, 
    '[{"product": "multi-balm", "quantity": 800, "price": 1.50}]'::jsonb,
    1200.00, 
    'new', 
    NOW() - INTERVAL '1 day'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);

  -- Order 7: dist_sidorov_id, delivered
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at, shipped_at)
  VALUES (
    dist_sidorov_id, 
    '[{"product": "sleeping-mask", "quantity": 1000, "price": 3.00}]'::jsonb,
    3000.00, 
    'delivered', 
    NOW() - INTERVAL '42 days', 
    NOW() - INTERVAL '40 days'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);

  -- Order 8: dist_sidorov_id, confirmed
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at)
  VALUES (
    dist_sidorov_id, 
    '[{"product": "bb-cream", "quantity": 600, "price": 2.50}, {"product": "multi-balm", "quantity": 1000, "price": 1.50}]'::jsonb,
    3000.00, 
    'confirmed', 
    NOW() - INTERVAL '12 days'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);

  -- Order 9: dist_sidorov_id, new
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at)
  VALUES (
    dist_sidorov_id, 
    '[{"product": "salmon-cream", "quantity": 250, "price": 4.00}]'::jsonb,
    1000.00, 
    'new', 
    NOW() - INTERVAL '2 days'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);

  -- Order 10: dist_vasiliev_id, confirmed
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at)
  VALUES (
    dist_vasiliev_id, 
    '[{"product": "sleeping-mask", "quantity": 400, "price": 3.00}, {"product": "bb-cream", "quantity": 800, "price": 2.50}]'::jsonb,
    3200.00, 
    'confirmed', 
    NOW() - INTERVAL '15 days'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);

  -- Order 11: dist_vasiliev_id, processing
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at)
  VALUES (
    dist_vasiliev_id, 
    '[{"product": "salmon-cream", "quantity": 600, "price": 4.00}]'::jsonb,
    2400.00, 
    'processing', 
    NOW() - INTERVAL '6 days'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);

  -- Order 12: dist_seoul_id, confirmed
  INSERT INTO public.orders (distributor_id, items, total_amount, status, created_at)
  VALUES (
    dist_seoul_id, 
    '[{"product": "bb-cream", "quantity": 1000, "price": 2.50}, {"product": "multi-balm", "quantity": 1500, "price": 1.50}]'::jsonb,
    4750.00, 
    'confirmed', 
    NOW() - INTERVAL '4 days'
  ) RETURNING id INTO o_id;
  order_ids := array_append(order_ids, o_id);


  -- 6. Payments (20 records)
  -- Order 1 (Total: 4000.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[1], 2000.00, (NOW() - INTERVAL '50 days')::date, (NOW() - INTERVAL '51 days')::date, 'paid', NOW() - INTERVAL '55 days');
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[1], 2000.00, (NOW() - INTERVAL '40 days')::date, (NOW() - INTERVAL '42 days')::date, 'paid', NOW() - INTERVAL '55 days');

  -- Order 2 (Total: 2000.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[2], 1000.00, (NOW() - INTERVAL '30 days')::date, (NOW() - INTERVAL '31 days')::date, 'paid', NOW() - INTERVAL '35 days');
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[2], 1000.00, (NOW() - INTERVAL '15 days')::date, NULL, 'overdue', NOW() - INTERVAL '35 days');

  -- Order 3 (Total: 1500.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[3], 750.00, (NOW() - INTERVAL '5 days')::date, (NOW() - INTERVAL '6 days')::date, 'paid', NOW() - INTERVAL '10 days');
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[3], 750.00, (NOW() + INTERVAL '10 days')::date, NULL, 'pending', NOW() - INTERVAL '10 days');

  -- Order 4 (Total: 2000.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[4], 2000.00, (NOW() - INTERVAL '40 days')::date, (NOW() - INTERVAL '41 days')::date, 'paid', NOW() - INTERVAL '48 days');

  -- Order 5 (Total: 1800.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[5], 900.00, (NOW() - INTERVAL '1 day')::date, NULL, 'overdue', NOW() - INTERVAL '8 days');
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[5], 900.00, (NOW() + INTERVAL '3 days')::date, NULL, 'pending', NOW() - INTERVAL '8 days');

  -- Order 6 (Total: 1200.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[6], 1200.00, (NOW() + INTERVAL '15 days')::date, NULL, 'pending', NOW() - INTERVAL '1 day');

  -- Order 7 (Total: 3000.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[7], 1500.00, (NOW() - INTERVAL '35 days')::date, (NOW() - INTERVAL '36 days')::date, 'paid', NOW() - INTERVAL '42 days');
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[7], 1500.00, (NOW() - INTERVAL '25 days')::date, (NOW() - INTERVAL '24 days')::date, 'paid', NOW() - INTERVAL '42 days');

  -- Order 8 (Total: 3000.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[8], 1500.00, (NOW() - INTERVAL '2 days')::date, NULL, 'overdue', NOW() - INTERVAL '12 days');
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[8], 1500.00, (NOW() + INTERVAL '5 days')::date, NULL, 'pending', NOW() - INTERVAL '12 days');

  -- Order 9 (Total: 1000.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[9], 1000.00, (NOW() + INTERVAL '12 days')::date, NULL, 'pending', NOW() - INTERVAL '2 days');

  -- Order 10 (Total: 3200.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[10], 1600.00, (NOW() - INTERVAL '5 days')::date, (NOW() - INTERVAL '4 days')::date, 'paid', NOW() - INTERVAL '15 days');
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[10], 1600.00, (NOW() + INTERVAL '3 days')::date, NULL, 'pending', NOW() - INTERVAL '15 days');

  -- Order 11 (Total: 2400.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[11], 1200.00, (NOW() + INTERVAL '1 day')::date, NULL, 'pending', NOW() - INTERVAL '6 days');
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[11], 1200.00, (NOW() + INTERVAL '10 days')::date, NULL, 'pending', NOW() - INTERVAL '6 days');

  -- Order 12 (Total: 4750.00)
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[12], 2375.00, (NOW() + INTERVAL '3 days')::date, NULL, 'pending', NOW() - INTERVAL '4 days');
  INSERT INTO public.payments (order_id, amount, due_date, paid_date, status, created_at)
  VALUES (order_ids[12], 2375.00, (NOW() + INTERVAL '14 days')::date, NULL, 'pending', NOW() - INTERVAL '4 days');


  -- 7. Inventory Transactions (30 records)
  -- Incoming
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('bb-cream', 1000, 'incoming', 'Initial stock import', NOW() - INTERVAL '80 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('salmon-cream', 1000, 'incoming', 'Initial stock import', NOW() - INTERVAL '80 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('multi-balm', 2000, 'incoming', 'Initial stock import', NOW() - INTERVAL '80 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('sleeping-mask', 1500, 'incoming', 'Initial stock import', NOW() - INTERVAL '80 days');

  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('bb-cream', 500, 'incoming', 'Restock batch #1', NOW() - INTERVAL '45 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('salmon-cream', 500, 'incoming', 'Restock batch #1', NOW() - INTERVAL '45 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('sleeping-mask', 500, 'incoming', 'Restock batch #1', NOW() - INTERVAL '45 days');

  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('bb-cream', 1000, 'incoming', 'Restock batch #2', NOW() - INTERVAL '20 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('multi-balm', 1000, 'incoming', 'Restock batch #2', NOW() - INTERVAL '20 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('sleeping-mask', 1000, 'incoming', 'Restock batch #2', NOW() - INTERVAL '20 days');

  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('salmon-cream', 300, 'incoming', 'Quick replenishment', NOW() - INTERVAL '10 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('bb-cream', 300, 'incoming', 'Quick replenishment', NOW() - INTERVAL '8 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('sleeping-mask', 300, 'incoming', 'Quick replenishment', NOW() - INTERVAL '5 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('multi-balm', 500, 'incoming', 'Stock adjustment', NOW() - INTERVAL '3 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, notes, created_at)
  VALUES ('salmon-cream', 500, 'incoming', 'Stock adjustment', NOW() - INTERVAL '2 days');

  -- Outgoing (associated with orders)
  -- Order 1
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('bb-cream', 1000, 'outgoing', order_ids[1], 'Fulfillment for Order #1', NOW() - INTERVAL '53 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('sleeping-mask', 500, 'outgoing', order_ids[1], 'Fulfillment for Order #1', NOW() - INTERVAL '53 days');

  -- Order 2
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('salmon-cream', 500, 'outgoing', order_ids[2], 'Fulfillment for Order #2', NOW() - INTERVAL '33 days');

  -- Order 3
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('multi-balm', 1000, 'outgoing', order_ids[3], 'Reserved for Order #3', NOW() - INTERVAL '10 days');

  -- Order 4
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('bb-cream', 800, 'outgoing', order_ids[4], 'Fulfillment for Order #4', NOW() - INTERVAL '46 days');

  -- Order 5
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('salmon-cream', 300, 'outgoing', order_ids[5], 'Reserved for Order #5', NOW() - INTERVAL '8 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('sleeping-mask', 200, 'outgoing', order_ids[5], 'Reserved for Order #5', NOW() - INTERVAL '8 days');

  -- Order 7
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('sleeping-mask', 1000, 'outgoing', order_ids[7], 'Fulfillment for Order #7', NOW() - INTERVAL '40 days');

  -- Order 8
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('bb-cream', 600, 'outgoing', order_ids[8], 'Reserved for Order #8', NOW() - INTERVAL '12 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('multi-balm', 1000, 'outgoing', order_ids[8], 'Reserved for Order #8', NOW() - INTERVAL '12 days');

  -- Order 10
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('sleeping-mask', 400, 'outgoing', order_ids[10], 'Reserved for Order #10', NOW() - INTERVAL '15 days');
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('bb-cream', 800, 'outgoing', order_ids[10], 'Reserved for Order #10', NOW() - INTERVAL '15 days');

  -- Order 11
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('salmon-cream', 600, 'outgoing', order_ids[11], 'Reserved for Order #11', NOW() - INTERVAL '6 days');

  -- Order 12
  INSERT INTO public.inventory_transactions (product, quantity, type, order_id, notes, created_at)
  VALUES ('bb-cream', 1000, 'outgoing', order_ids[12], 'Reserved for Order #12', NOW() - INTERVAL '4 days');


  -- 8. Activity Log (25 records)
  -- 1. lead_created (5 records)
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'lead_created', 'lead', lead_ids[1], NOW() - INTERVAL '13 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'lead_created', 'lead', lead_ids[2], NOW() - INTERVAL '11 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'lead_created', 'lead', lead_ids[3], NOW() - INTERVAL '10 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'lead_created', 'lead', lead_ids[4], NOW() - INTERVAL '9 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'lead_created', 'lead', lead_ids[7], NOW() - INTERVAL '6 days');

  -- 2. new_order (7 records)
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (dist_ivanov_id, 'new_order', 'order', order_ids[3], NOW() - INTERVAL '10 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (dist_petrov_id, 'new_order', 'order', order_ids[5], NOW() - INTERVAL '8 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (dist_sidorov_id, 'new_order', 'order', order_ids[8], NOW() - INTERVAL '12 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (dist_vasiliev_id, 'new_order', 'order', order_ids[10], NOW() - INTERVAL '15 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (dist_vasiliev_id, 'new_order', 'order', order_ids[11], NOW() - INTERVAL '6 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (dist_seoul_id, 'new_order', 'order', order_ids[12], NOW() - INTERVAL '4 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (dist_petrov_id, 'new_order', 'order', order_ids[6], NOW() - INTERVAL '1 day');

  -- 3. status_change (6 records)
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'confirmed', 'order', order_ids[8], NOW() - INTERVAL '11 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'confirmed', 'order', order_ids[10], NOW() - INTERVAL '14 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'confirmed', 'order', order_ids[12], NOW() - INTERVAL '3 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'processing', 'order', order_ids[3], NOW() - INTERVAL '9 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'processing', 'order', order_ids[5], NOW() - INTERVAL '7 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'processing', 'order', order_ids[11], NOW() - INTERVAL '5 days');

  -- 4. payment_added (4 records)
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'payment_added', 'payment', order_ids[3], NOW() - INTERVAL '10 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'payment_added', 'payment', order_ids[5], NOW() - INTERVAL '8 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'payment_added', 'payment', order_ids[10], NOW() - INTERVAL '15 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'payment_added', 'payment', order_ids[12], NOW() - INTERVAL '4 days');

  -- 5. inventory_incoming (3 records)
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'inventory_incoming', 'inventory', admin_id, NOW() - INTERVAL '10 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'inventory_incoming', 'inventory', admin_id, NOW() - INTERVAL '8 days');
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, created_at)
  VALUES (admin_id, 'inventory_incoming', 'inventory', admin_id, NOW() - INTERVAL '5 days');

END $$;
