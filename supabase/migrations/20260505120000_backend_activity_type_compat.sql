-- Backend activity type compatibility.
--
-- The new routing and outbound functions write durable events to lead_events and
-- compatibility rows to legacy lead_activity for the current admin timeline.

alter type public.activity_type add value if not exists 'routing_assigned';
alter type public.activity_type add value if not exists 'routing_no_match';
alter type public.activity_type add value if not exists 'routing_manual_review';
alter type public.activity_type add value if not exists 'outbound_message_queued';
