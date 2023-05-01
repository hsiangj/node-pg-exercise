const express = require('express');
const slugify = require('slugify');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({companies: results.rows})
  } catch (e) {
    return next(e)
  }
})

router.get('/:code', async (req, res, next) => {
  try {
    const {code} = req.params;
    const companyResults = await db.query(`SELECT code, name, description FROM companies WHERE code = $1`, [code]);
    const invoiceResults = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [code]);
    const industryResults = await db.query(
      `SELECT i.industry
      FROM industries AS i 
      LEFT JOIN industries_companies as ic
      ON i.code = ic.industry_code
      LEFT JOIN companies as c
      ON c.code = ic.company_code
      WHERE c.code = $1`, [code])
    if(companyResults.rows.length === 0){
      throw new ExpressError(`Can't find company with code: ${code}`, 404)
    }

    const company = companyResults.rows[0];
    const invoices = invoiceResults.rows;
    company.invoices = invoices.map(inv => inv.id);
    const industries = industryResults.rows;
    company.industries = industries.map(ind => ind.industry)

    return res.json({company: company})
  } catch (e) {
    return next(e)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const {name, description} = req.body;
    let code = slugify(name, {lower: true, replacement:'', remove:/[*+~.()'"!:@]/g });
    const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
    return res.status(201).json({company: results.rows[0]})
  } catch (e) {
    return next(e)
  }
})

router.put('/:code', async (req, res, next) => {
  try {
    const {code} = req.params;
    const {name, description} = req.body;
    const results = await db.query(`UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING code, name, description`, [name, description, code]);
    if (results.rows.length === 0){
      throw new ExpressError(`Can't find company with code: ${code}`, 404)
    } 
    return res.json({company: results.rows[0]})
  } catch(e) {
    return next(e)
  }
})

router.delete('/:code', async (req, res, next) => {
  try {
    const {code} = req.params;
    const results = await db.query(`DELETE FROM companies WHERE code = $1 RETURNING code`, [code]);
    if(results.rows.length === 0){
      throw new ExpressError(`Can't find company with code: ${code}`, 404)
    }
    return res.json({status: 'deleted'})
  } catch(e) {
    return next(e)
  }
})



module.exports = router;