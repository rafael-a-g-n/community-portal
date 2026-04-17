/**
 * @typedef {'open' | 'in_progress' | 'resolved'} ReportStatus
 */

/**
 * @typedef {Object} Category
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {string} icon
 */

/**
 * @typedef {Object} Report
 * @property {string} id - UUID
 * @property {string} title
 * @property {string} description
 * @property {Category | number} category
 * @property {ReportStatus} status
 * @property {string | null} [photo]
 * @property {string} [image]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {number} count
 * @property {string | null} next
 * @property {string | null} previous
 * @property {T[]} results
 */
