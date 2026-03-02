/**
 * Paginate a Mongoose query
 * @param {Object} query - Mongoose model (e.g., Schedule, Assignment)
 * @param {Object} filter - MongoDB filter object
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (from query params)
 * @param {number} options.limit - Items per page (from query params)
 * @param {Object} options.sort - Sort object (e.g., { createdAt: -1 })
 * @param {string|Object} options.populate - Populate options
 * @returns {Promise<Object>} Paginated result with data and metadata
 */
export const paginate = async (query, filter, options = {}) => {
  const { page, limit, sort = {}, populate } = options;

  // Check if pagination is requested (backward compatibility)
  const isPaginationRequested = page !== undefined || limit !== undefined;

  // If no pagination requested, return all data
  if (!isPaginationRequested) {
    let dataQuery = query.find(filter);
    
    if (Object.keys(sort).length > 0) {
      dataQuery = dataQuery.sort(sort);
    }
    
    if (populate) {
      dataQuery = dataQuery.populate(populate);
    }
    
    const data = await dataQuery;
    
    return {
      success: true,
      data
    };
  }

  // Sanitize pagination parameters
  const sanitizedParams = sanitizePageParams(page, limit);
  const sanitizedPage = sanitizedParams.page;
  const sanitizedLimit = sanitizedParams.limit;

  // Calculate skip value
  const skip = (sanitizedPage - 1) * sanitizedLimit;

  // Execute data query and count query in parallel
  const [data, total] = await Promise.all([
    (async () => {
      let dataQuery = query.find(filter).skip(skip).limit(sanitizedLimit);
      
      if (Object.keys(sort).length > 0) {
        dataQuery = dataQuery.sort(sort);
      }
      
      if (populate) {
        dataQuery = dataQuery.populate(populate);
      }
      
      return await dataQuery;
    })(),
    query.countDocuments(filter)
  ]);

  // Calculate total pages
  const totalPages = Math.ceil(total / sanitizedLimit);

  // Return standardized response format
  return {
    success: true,
    data,
    pagination: {
      page: sanitizedPage,
      limit: sanitizedLimit,
      total,
      totalPages
    }
  };
};

/**
 * Sanitize page and limit parameters
 * @param {*} page - Page parameter from request
 * @param {*} limit - Limit parameter from request
 * @returns {Object} Sanitized page and limit
 */
const sanitizePageParams = (page, limit) => {
  let sanitizedPage = parseInt(page);
  let sanitizedLimit = parseInt(limit);

  // Handle invalid page
  if (isNaN(sanitizedPage) || sanitizedPage < 1) {
    sanitizedPage = 1;
  }

  // Handle invalid limit
  if (isNaN(sanitizedLimit) || sanitizedLimit < 1) {
    sanitizedLimit = 10;
  }

  // Cap limit at 100
  if (sanitizedLimit > 100) {
    sanitizedLimit = 100;
  }

  return { page: sanitizedPage, limit: sanitizedLimit };
};
