-- Sample equipment library (idempotent: skips rows that already match by title)

insert into public.equipment (title, description, image_url)
select v.title, v.description, v.image_url
from (
  values
    ('Dumbbells', 'Fixed or adjustable dumbbells for upper-body, core, and accessory strength work.', null::text),
    ('Yoga mat', 'Cushioned, non-slip surface for floor work, mobility, and core stability.', null::text),
    ('Pilates ball', 'Also called a stability ball—great for core, balance, and controlled movement patterns.', null::text),
    ('Resistance bands', 'Light to heavy bands for warm-ups, activation, and strength without heavy loads.', null::text),
    ('Kettlebell', 'For swings, carries, and full-body power; choose a weight you can control with good form.', null::text),
    ('Foam roller', 'Self-massage and mobility prep for muscles around the hips, back, and legs.', null::text),
    ('Medicine ball', 'For throws, slams (where appropriate), and rotational power drills.', null::text),
    ('Jump rope', 'Footwork, conditioning, and coordination—use a length that clears comfortably underfoot.', null::text),
    ('Ankle weights', 'Light optional load for controlled hip and glute work; avoid max jumping with heavy pairs.', null::text),
    ('Suspension trainer', 'Bodyweight rows, planks, and single-leg work using straps and handles.', null::text)
) as v(title, description, image_url)
where not exists (
  select 1 from public.equipment e where e.title = v.title
);
