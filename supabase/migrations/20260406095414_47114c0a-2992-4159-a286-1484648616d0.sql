UPDATE exhibitions e
SET organizer_id = o.id
FROM organizers o
WHERE e.organizer_id IS NULL
  AND (lower(e.organizer_name) = lower(o.name) OR lower(e.organizer_name_ar) = lower(o.name_ar));