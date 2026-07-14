update public.order_events
set title = 'طلب إرجاع'
where event_type = 'order.return_requested'
  and title = 'Ø·Ù„Ø¨ Ø¥Ø±Ø¬Ø§Ø¹';

update public.order_events
set description = 'تم إرسال طلب الإرجاع وسيتم مراجعته.'
where event_type = 'order.return_requested'
  and description = 'ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹ ÙˆØ³ÙŠØªÙ… Ù…Ø±Ø§Ø¬Ø¹ØªÙ‡.';

update public.order_events
set title = 'اعتماد المرتجع'
where event_type = 'order.return_approved'
  and title = 'Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø±ØªØ¬Ø¹';

update public.order_events
set description = 'تم اعتماد طلب الإرجاع.'
where event_type = 'order.return_approved'
  and description = 'ØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹.';

update public.order_events
set title = 'رفض المرتجع'
where event_type = 'order.return_rejected'
  and title = 'Ø±ÙØ¶ Ø§Ù„Ù…Ø±ØªØ¬Ø¹';

update public.order_events
set description = 'تم رفض طلب الإرجاع.'
where event_type = 'order.return_rejected'
  and description = 'ØªÙ… Ø±ÙØ¶ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹.';

update public.order_events
set title = 'تسجيل استرداد'
where event_type = 'order.refunded'
  and title = 'ØªØ³Ø¬ÙŠÙ„ Ø§Ø³ØªØ±Ø¯Ø§Ø¯';

update public.order_events
set description = 'تم تسجيل استرداد يدوي للمرتجع.'
where event_type = 'order.refunded'
  and description = 'ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ø³ØªØ±Ø¯Ø§Ø¯ ÙŠØ¯ÙˆÙŠ Ù„Ù„Ù…Ø±ØªØ¬Ø¹.';

update public.order_events
set title = 'إغلاق المرتجع'
where event_type = 'order.return_closed'
  and title = 'Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…Ø±ØªØ¬Ø¹';

update public.order_events
set description = 'تم إغلاق المرتجع دون استرداد إضافي.'
where event_type = 'order.return_closed'
  and description = 'ØªÙ… Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…Ø±ØªØ¬Ø¹ Ø¯ÙˆÙ† Ø§Ø³ØªØ±Ø¯Ø§Ø¯ Ø¥Ø¶Ø§ÙÙŠ.';
