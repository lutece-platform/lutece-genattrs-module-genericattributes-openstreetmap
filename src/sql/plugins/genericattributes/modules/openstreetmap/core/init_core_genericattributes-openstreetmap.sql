-- liquibase formatted sql
-- changeset genericattributes-openstreetmap:init_core_genericattributes-openstreetmap.sql
-- preconditions onFail:MARK_RAN onError:WARN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM core_admin_security_header WHERE name = 'Content-Security-Policy' AND type = 'page' AND value LIKE '%tile.openstreetmap.org%'
-- The map loads its tiles from *.tile.openstreetmap.org (img-src) and reads the address of a point from nominatim.openstreetmap.org (connect-src):
-- both sources are added to the Content-Security-Policy of the pages, otherwise the browser blocks them and the map stays empty
UPDATE core_admin_security_header SET value = REPLACE( value, 'img-src ', 'img-src https://*.tile.openstreetmap.org ' ) WHERE name = 'Content-Security-Policy' AND type = 'page' AND value LIKE '%img-src %';
UPDATE core_admin_security_header SET value = REPLACE( value, 'connect-src ', 'connect-src https://nominatim.openstreetmap.org ' ) WHERE name = 'Content-Security-Policy' AND type = 'page' AND value LIKE '%connect-src %' AND value NOT LIKE '%nominatim.openstreetmap.org%';
