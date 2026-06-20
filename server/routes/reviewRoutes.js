// const express = require('express');
// const router = express.Router();
// const {submitReview, getProviderReviews} = require('../controllers/reviewController');
// const authMiddleware = require('../middlewares/authMiddleware'); 

// router.post('/submit', authMiddleware, submitReview);
// router.get('/provider/:id', getProviderReviews);

// module.exports = router;


"use strict";

const express = require("express");
const router = express.Router();

const {
  submitReview,
  getProviderReviews,
  hideReview,
  getMyReviews,
} = require("../controllers/reviewController");

const authMiddleware    = require("../middlewares/authMiddleware");
const authorizeRoles   = require("../middlewares/authorizeRoles");
const adminMiddleware  = require("../middlewares/adminMiddleware");

// ── Authenticated user routes ──────────────────────────────────────────────────

/**
 * @route   POST /api/review/submit
 * @desc    Submit a review for a delivered order
 * @access  Private (User)
 */
router.post(
  "/submit",
  authMiddleware,
  authorizeRoles("user"),
  submitReview
);

/**
 * @route   GET /api/review/my
 * @desc    Get all reviews submitted by the authenticated user
 * @access  Private (User)
 *
 * NOTE: Declared BEFORE /provider/:id and /:id to prevent Express
 * matching "my" as a route param.
 */
router.get(
  "/my",
  authMiddleware,
  authorizeRoles("user"),
  getMyReviews
);

// ── Admin routes ───────────────────────────────────────────────────────────────

/**
 * @route   PATCH /api/review/:id/hide
 * @desc    Admin soft-hides an abusive review (sets isVisible: false)
 * @access  Private (Admin)
 */
router.patch(
  "/:id/hide",
  authMiddleware,
  adminMiddleware,
  hideReview
);

// ── Public routes ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/review/provider/:id
 * @desc    Get all visible reviews for a provider with average rating
 * @query   page, limit
 * @access  Public
 */
router.get("/provider/:id", getProviderReviews);

module.exports = router;