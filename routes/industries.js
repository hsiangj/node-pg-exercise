const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// List all industries with associated company codes
router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`
      SELECT i.code, i.industry, ic.company_code 
      FROM industries AS i
      LEFT JOIN industries_companies AS ic
      ON i.code = ic.industry_code`);
    
    const industries = {};
    results.rows.forEach(row => {
      if(!industries[row.code]){
        industries[row.code] = {
          code: row.code,
          industry: row.industry,
          companies: []
        };
      }
      if(row.company_code){
        industries[row.code].companies.push(row.company_code);
      }
    })
    return res.json({industries: industries})
  } catch(e) {
    return next(e)
  }
})

// Create a new industry
router.post('/', async (req, res, next) => {
  try {
    const {code, industry} = req.body;
    const results = await db.query(`INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`, [code, industry]);
    return res.status(201).json({industry: results.rows[0]})
  } catch(e) {
    return next(e)
  }
})

// Associate an industry with a company
router.post('/:code', async (req, res, next) => {
  try {
    const {code} = req.params;
    const {compCode} = req.body;
    const industryCheck = await db.query(`SELECT code FROM industries WHERE code = $1`, [code])
    const companyCheck = await db.query(`SELECT code FROM companies WHERE code = $1`, [compCode])
    if(industryCheck.rows.length === 0){
      throw new ExpressError(`Invalid industry code`, 404);
    }else if(companyCheck.rows.length === 0){
      throw new ExpressError(`Invalid company code`, 404);
    }
    const results = await db.query('INSERT INTO industries_companies (industry_code, company_code) VALUES ($1, $2) RETURNING industry_code, company_code', [code, compCode])
    return res.status(201).json({association: results.rows[0]})
  } catch(e) {
    return next(e)
  }
})

module.exports = router;