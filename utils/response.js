export const sucessResponse = (
  res,
  statusCode = 200,
  message = "Success",
  data = null
) => {
  const response = {
    success: true,
    message,
    data,
  };

  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res,
  statusCode = 500,
  message = "Internal Server Error",
  error = null
) => {
  const response = {
    success: false,
    message,
    error
  };

  return res.status(statusCode).json(response);
};



export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  DELETED:410
};