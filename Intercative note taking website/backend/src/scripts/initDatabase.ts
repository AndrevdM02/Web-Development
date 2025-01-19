import pool from '../db/connection';
import crypto from "node:crypto";

import { saltAndHashPassword } from '../utils/saltAndHashPassword';

async function main() {
    //pool is a connection pool that connects to the database
    const client = await pool.connect();

    try {
        //since this is the initial setup, we will drop the tables if they exist
        await pool.query('DROP TABLE IF EXISTS public.notes CASCADE');
        await pool.query('DROP TABLE IF EXISTS public.users CASCADE');
        await pool.query('DROP TABLE IF EXISTS public."Categories" CASCADE');
        await pool.query('DROP TABLE IF EXISTS public.shared_notes CASCADE');

        console.log('Cleared old table information');

        //create the Users table
        await pool.query(`
     CREATE TABLE IF NOT EXISTS public.users
(
    user_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    user_name character varying(128) COLLATE pg_catalog."default" NOT NULL,
    password character varying(128) COLLATE pg_catalog."default" NOT NULL,
    image_url text COLLATE pg_catalog."default" NOT NULL DEFAULT 'https://media.istockphoto.com/id/1687018104/vector/vector-flat-illustration-in-grayscale-avatar-user-profile-person-icon-gender-neutral.jpg?s=612x612&w=0&k=20&c=PDi0AqXTtZ6d2Y7ahkMJEraVrC_fYCvx0HW508OWg-4='::text,
    salt_password text COLLATE pg_catalog."default" NOT NULL,
    email character varying(128) COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_user_name_user_name1_key UNIQUE (user_name)
        INCLUDE(user_name)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;
`);

        console.log('Created Users table');

        //create the Categories table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS public."Categories"
(
    category_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    category_name character varying(128) COLLATE pg_catalog."default" NOT NULL,
    user_id integer,
    CONSTRAINT categories_pkey PRIMARY KEY (category_id)
        INCLUDE(category_id),
    CONSTRAINT user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Categories"
    OWNER to postgres;
-- Index: fki_user_id_fkey

-- DROP INDEX IF EXISTS public.fki_user_id_fkey;

CREATE INDEX IF NOT EXISTS fki_user_id_fkey
    ON public."Categories" USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;
`);

        console.log('Created Categories table');


        //create the Notes table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS public.notes
(
    note_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    user_id integer NOT NULL,
    note_name text COLLATE pg_catalog."default" NOT NULL,
    content text COLLATE pg_catalog."default",
    edited_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category integer,
    CONSTRAINT notes_pkey PRIMARY KEY (note_id),
    CONSTRAINT notes_catid_fkey FOREIGN KEY (category)
        REFERENCES public."Categories" (category_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT notes_userid_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.notes
    OWNER to postgres;
`);

        console.log('Created Notes table');

        //create the shared_notes table
        await pool.query(`
CREATE TABLE IF NOT EXISTS public.shared_notes
(
    shared_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    note_id integer NOT NULL,
    user_id integer NOT NULL,
    CONSTRAINT shared_notes_pkey PRIMARY KEY (shared_id),
    CONSTRAINT fkey_note_id FOREIGN KEY (note_id)
        REFERENCES public.notes (note_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
        NOT VALID,
    CONSTRAINT fkey_user_id FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.shared_notes
    OWNER to postgres;
-- Index: fki_fkey_note_id

-- DROP INDEX IF EXISTS public.fki_fkey_note_id;

CREATE INDEX IF NOT EXISTS fki_fkey_note_id
    ON public.shared_notes USING btree
    (note_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: fki_fkey_user_id

-- DROP INDEX IF EXISTS public.fki_fkey_user_id;

CREATE INDEX IF NOT EXISTS fki_fkey_user_id
    ON public.shared_notes USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;
`);

        //this clears any old values
        await pool.query('TRUNCATE TABLE "Categories", Notes, Users, Shared_Notes RESTART IDENTITY CASCADE');

        //add some initial data to the Users table
        const password1 = 'ludwig';
        const salt1 = crypto.randomBytes(128).toString('base64');
        const pwHash1 = saltAndHashPassword(password1, salt1);
        const password2 = 'andre';
        const salt2 = crypto.randomBytes(128).toString('base64');
        const pwHash2 = saltAndHashPassword(password2, salt2);
        const password3 = 'dieter';
        const salt3 = crypto.randomBytes(128).toString('base64');
        const pwHash3 = saltAndHashPassword(password2, salt3);

        await pool.query(`INSERT INTO Users (user_name, password, email, salt_password) VALUES ($1, $2, $3, $4)`, ['ludwig', pwHash1, '25325957@sun.ac.za', salt1]);
        await pool.query(`INSERT INTO Users (user_name, password, email, salt_password) VALUES ($1, $2, $3, $4)`, ['andre', pwHash2, '24923273@sun.ac.za', salt2]);
        await pool.query(`INSERT INTO Users (user_name, password, email, salt_password) VALUES ($1, $2, $3, $4)`, ['dieter', pwHash3, '25047612@sun.ac.za', salt3]);
        await pool.query(`INSERT INTO Users (user_name, password, email, salt_password) VALUES ($1, $2, $3, $4)`, ['dieter', pwHash3, '25047612@sun.ac.za', salt3]);
        //add some initial data to the Notes table
        await pool.query('INSERT INTO Notes (user_id, content, note_name) VALUES ($1, $2, $3)', [1, 'This is a note for user 1', 'Note 1']);
        await pool.query('INSERT INTO Notes (user_id, content, note_name) VALUES ($1, $2, $3)', [1, 'This is another note for user 1', 'Note 2']);
        await pool.query('INSERT INTO Notes (user_id, content, note_name) VALUES ($1, $2, $3)', [2, 'This is a note for user 2', 'Note 3']);
        await pool.query('INSERT INTO Notes (user_id, content, note_name) VALUES ($1, $2, $3)', [2, 'This is another note for user 2', 'Note 4']);
        await pool.query('INSERT INTO Notes (user_id, content, note_name) VALUES ($1, $2, $3)', [3, 'This is a note for user 3', 'Note 5']);
        await pool.query('INSERT INTO Notes (user_id, content, note_name) VALUES ($1, $2, $3)', [3, 'This is another note for user 3', 'Note 6']);

        //add some initial data to the Categories table
        await pool.query('INSERT INTO "Categories" (category_name) VALUES ($1)', ['CS343']);
        await pool.query('INSERT INTO "Categories" (category_name) VALUES ($1)', ['CS344']);
        await pool.query('INSERT INTO "Categories" (category_name) VALUES ($1)', ['CS345']);

        //add some initial data to the Shared_Notes table
        await pool.query('INSERT INTO "Shared_Notes" (note_id, user_id) VALUES ($1, $2)', [1, 2]);
        await pool.query('INSERT INTO "Shared_Notes" (note_id, user_id) VALUES ($1, $2)', [2, 3]);
        await pool.query('INSERT INTO "Shared_Notes" (note_id, user_id) VALUES ($1, $2)', [3, 1]);

        console.log('Successfully added initial data to the tables');

    } catch (error) {
        console.error('Error initialising the database: ', error);
    } finally {
        client.release();
        await pool.end();
        console.log('Connection pool closed');
        return false;
    }

}

main();
