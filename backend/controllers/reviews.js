const asyncWrapper = require("../middleware/async")
const { createCustomError } = require("../errors/custom-error")
const Review = require("../models/Review")
const Details = require("../models/Details")

// Constants that represent the type of review being submitted
const GOOD_REVIEW = "Good review"
const BAD_REVIEW = "Bad review"
// Constants that represent the type of detail
const INCOMING_BILL = "incoming"
const OUTGOING_BILL = "outgoing"

const ErrReviewExists = createCustomError(
  "This user already posted a review of this type",
  409
)
const ErrInvalidFormat = createCustomError(
  "Invalid type of review",
  400
)
const ErrInvalidDetail = createCustomError(
  "Invalid type of detail",
  400
)
const ErrReviewNotFound = createCustomError(
  "Review not found",
  404
)
const ErrInvalidAccount = account => {
  return createCustomError(`Invalid type of account: ${account}`, 500)
}

const postReview = asyncWrapper(async (req, res, next) => {
  // Isn't the user logged in? Unauthorized
  const { session } = req
  if (!session.isLoggedIn) return res.status(401).end()

  // The location of the user is unknown? Bad request
  if (!session.location) return res.status(400).send("Location required")

  const { billInfo, review, typeOfReview } = req.body
  // Validations
  if (!billInfo) return res.status(400).send("Undefined billInfo")
  if (!review) return res.status(400).send("Undefined review")
  if (!typeOfReview) return res.status(400).send("Undefined type of review")

  const { serialNumber:sn, value, series } = billInfo
  const snTrim = sn.replace(/\s/g, "")
  const billID = `${snTrim}-${value}-${series}`

  billInfo.serialNumber = snTrim

  review.userId = session.user.userId
  review.location = session.location

  // Get previous reviews
  let isNewReview = false
  let fullReview = await Review.findOne({_id: billID})
  if (!fullReview) {
    isNewReview = true
    fullReview = {
      billInfo,
      userReviews: {
        goodReviews: [],
        badReviews: []
      },
      businessReviews: {
        goodReviews: [],
        badReviews: []
      },
      defects: null,
      ratings: 0,
      avgRating: 0.0
    }
  }

  try {
    let target
    let update
    let updatedReview
    switch (session.user.typeOfAccount) {
      case "admin":
      case "regular":
      target = fullReview.userReviews

      switch (typeOfReview) {

        case GOOD_REVIEW:
        update = updateGoodReviews
        break

        case BAD_REVIEW:
        update = updateBadReviews
        break

        default:
        return next(ErrInvalidFormat)
      }

      updatedReview = await update(fullReview, target, review)
      fullReview = updatedReview.fullReview
      fullReview.userReviews = updatedReview.target

      break

      case "business":
      target = fullReview.businessReviews

      switch (typeOfReview) {

        case GOOD_REVIEW:
        update = updateGoodReviews
        break

        case BAD_REVIEW:
        update = updateBadReviews
        break

        default:
        return next(ErrInvalidFormat)
      }

      updatedReview = await update(fullReview, target, review)
      fullReview = updatedReview.fullReview
      fullReview.businessReviews = updatedReview.target

      break
      default:
      return next(ErrInvalidAccount(session.user.typeOfAccount))
    }
  } catch(err) {
    return next(err)
  }
  // Save review to the database
  if (isNewReview) {
    await Review.create({
      _id: billID,
      ...fullReview
    })
  } else {
    const result = await Review.findOneAndUpdate({_id: billID}, fullReview, {
      new: true,
      runValidators: true
    })
  }
  res.status(201).end()
})

const getReview = asyncWrapper(async (req, res, next) => {
  const { sn, value, series } = req.query
  const billInfo = {
    serialNumber: sn,
    value,
    series
  }
  // Validations
  if (!sn) return res.status(400).send("Undefined serial number")
  if (!value) return res.status(400).send("Undefined value")
  if (!series) return res.status(400).send("Undefined series")

  // Remove whitespaces from serial number.
  const snTrim = sn.replace(/\s/g, "")

  // Build _id
  const billID = `${snTrim}-${value}-${series}`

  const format = req.session.isLoggedIn ? "full" : "basic"

  // Query reviews
  const fullReview = await Review.findOne({_id: billID})
  if (!fullReview) {
    // There are no reviews for this bill
    return res.status(404).json(formatReview({billInfo, fullReview: null, format}))
  }

  return res.json(formatReview({billInfo, fullReview, format}))
})

// Format review stored in mongo to be sent to client as JSON.
// The format field can be either "full" or "basic".
const formatReview = ({billInfo, fullReview, fullDetails, format}) => {

  const formatBasicReview = r => {
    const { date, comment, location, userId } = r
    return {
      date,
      comment,
      location,
      userId
    }
  }
  const formatGoodReviews = reviews => {
    return reviews.map(r => ({
      ...formatBasicReview(r),
      rating: r.rating
    }))
  }
  const formatBadReviews = reviews => {
    return reviews.map(r => ({
      ...formatBasicReview(r),
      defects: r.defects
    }))
  }

  if (!fullReview) {
    // Review not found
    switch (format) {
      case "full":
      return {
        billInfo,
        goodReviews: 0,
        badReviews: 0,
        avgRating: 0,
        userReviews: {
          goodReviews: null,
          badReviews: null,
        },
        businessReviews: {
          goodReviews: null,
          badReviews: null,
        },
        defects: null
      }
      case "basic":
      return {
        billInfo,
        goodReviews: 0,
        badReviews: 0,
        avgRating: 0,
        defects: null
      }
      default:
      return null
    }
  }

  const good = fullReview.userReviews.goodReviews.length +
    fullReview.businessReviews.goodReviews.length
  const bad = fullReview.userReviews.badReviews.length +
    fullReview.businessReviews.badReviews.length

  switch (format) {
    case "full":
    return {
      billInfo,
      goodReviews: good,
      badReviews: bad,
      avgRating: fullReview.avgRating,
      defects: fullReview.defects,
      userReviews: {
        goodReviews: formatGoodReviews(fullReview.userReviews.goodReviews),
        badReviews: formatBadReviews(fullReview.userReviews.badReviews)
      },
      businessReviews: {
        goodReviews: formatGoodReviews(fullReview.businessReviews.goodReviews),
        badReviews: formatBadReviews(fullReview.businessReviews.badReviews)
      },
      details: fullDetails ? fullDetails.details : null
    }
    case "basic":
    return {
      billInfo,
      goodReviews: good,
      badReviews: bad,
      avgRating: fullReview.avgRating
    }
    default:
    return null
  }
}

// 1. Ensure the user is not submitting more than one review per bill.
// 2. Update defects; if the defect's not there, append it.
// 3. Append review to this bill's list of bad reviews.
// The promise resolves the modified fullReview and the list of both bad and
// good reviews in targetReviews.
const updateBadReviews = (fullReview, targetReviews, review) => {
  return new Promise((resolve, reject) => {
    const fullReviewCopy = JSON.parse(JSON.stringify(fullReview))
    const reviews = [...targetReviews.badReviews]
    // Allow only 1 review per user
    for (storedReview of reviews) {
      if (storedReview.userId === review.userId) {
        reject(ErrReviewExists)
      }
    }
    // Update defects; if the defect's not there, append it
    if (!fullReviewCopy.defects) {
      fullReviewCopy.defects = [...review.defects]
    } else {
      for (defect of review.defects) {
        let found = false
        for (storedDefect of fullReview.defects) {
          if (defect === storedDefect) {
            found = true
            break
          }
        }
        if (!found) {
            fullReviewCopy.defects.push(defect)
        }
      }
    }
    // Push review to this bill's list of bad reviews
    reviews.push(review)
    resolve({
      fullReview: fullReviewCopy,
      target: {
        ...targetReviews,
        badReviews: reviews
      }
    })
  })
}

// 1. Ensure the user is not submitting more than one review per bill.
// 2. Update ratings and avg rating in fullReview.
// 3. Append review to this bill's list of good reviews.
// The promise resolves the modified fullReview and the list of both bad and
// good reviews in targetReviews.
const updateGoodReviews = (fullReview, targetReviews, review) => {
  return new Promise((resolve,reject) => {
    const fullReviewCopy = JSON.parse(JSON.stringify(fullReview))
    const reviews = [...targetReviews.goodReviews]
    // Allow only 1 review per user
    for (storedReview of reviews) {
      if (storedReview.userId === review.userId) {
        reject(ErrReviewExists)
        return
      }
    }
    // Update ratings and avg rating
    let totalReviews = fullReview.userReviews.goodReviews.length
    totalReviews += fullReview.businessReviews.goodReviews.length
    totalReviews++ // Add this review
    fullReviewCopy.ratings += review.rating
    fullReviewCopy.avgRating = fullReviewCopy.ratings / totalReviews
    // Push review to this bill's list of good reviews
    reviews.push(review)
    resolve({
      fullReview: fullReviewCopy,
      target: {
        ...targetReviews,
        goodReviews: reviews
      }
    })
  })
}

module.exports = {
  getReview,
  postReview
}