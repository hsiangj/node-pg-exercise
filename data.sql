\c biztime_test

DROP TABLE IF EXISTS invoices
CASCADE;
DROP TABLE IF EXISTS companies
CASCADE;
DROP TABLE IF EXISTS industries
CASCADE;
DROP TABLE IF EXISTS industries_companies
CASCADE;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
    code text PRIMARY KEY,
    industry text NOT NULL UNIQUE
);

CREATE TABLE industries_companies (
    industry_code TEXT NOT NULL REFERENCES industries,
    company_code TEXt NOT NULL REFERENCES companies,
    PRIMARY KEY(industry_code, company_code)
);

------- commented out for tests
-- INSERT INTO companies
--   VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
--          ('ibm', 'IBM', 'Big blue.');

-- INSERT INTO invoices (comp_Code, amt, paid, paid_date)
--   VALUES ('apple', 100, false, null),
--          ('apple', 200, false, null),
--          ('apple', 300, true, '2018-01-01'),
--          ('ibm', 400, false, null);

-- INSERT INTO industries 
-- VALUES 
-- ('acct', 'Accounting'), 
-- ('it', 'Information Technology'),
-- ('ai', 'Artificial Intelligence');

-- INSERT INTO industries_companies
-- VALUES 
-- ('it', 'apple'),
-- ('it', 'ibm'),
-- ('ai', 'ibm');

