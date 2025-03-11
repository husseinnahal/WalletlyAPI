const globalErrorHandler = (err, req, res, next) => {
    console.error(err); 

    const isDev = process.env.NODE_ENV === 'development';
    const statusCode = err.statusCode || 500; 

    if (req.originalUrl.startsWith('/api')) {
        return res.status(statusCode).json({
            status: false,
            message: isDev ? err.message : 'Something went wrong, please try again later.',
            stack: isDev ? err.stack : undefined,
        });
    }

    return res.status(statusCode).render('pages/error', {
        message: isDev ? err.message : 'Something went wrong, please try again later.',
        error: isDev ? err : {},
        title: 'Error',
    });
};

export default globalErrorHandler;
