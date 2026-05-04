-- Manual rollback for the Chronos foundation migration.
-- This removes only the chronos schema, but it will delete all Chronos data.
-- Do not run after production data exists unless it has been backed up.

drop schema if exists chronos cascade;
